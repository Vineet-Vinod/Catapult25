// script.js

document.addEventListener('DOMContentLoaded', function() {

    // --- DOM Element References ---
    const openFolderButton = document.getElementById('open-folder-button');
    const folderInput = document.getElementById('folder-input');
    const homeScreen = document.getElementById('home-screen');
    const mainIdeView = document.getElementById('main-ide-view');
    const recordButton = document.getElementById('record-button');
    const recordHint = document.getElementById('record-hint');
    const folderNameDisplay = document.getElementById('folder-name-display');
    const fileTreeElement = document.getElementById('file-tree');
    const editorArea = document.getElementById('editor-area');
    const currentFileDisplay = document.getElementById('current-file-display');
    const fileEditor = document.getElementById('file-editor');
    const recordArea = document.getElementById('record-area'); // Added for hiding later
    const bottomBar = document.getElementById('bottom-bar');   // Added for showing later

    // --- Event Listener for Open Folder Button ---
    if (openFolderButton && folderInput) {
        openFolderButton.addEventListener('click', () => {
            folderInput.click();
        });
    } else {
        console.error("Could not find 'open-folder-button' or 'folder-input'.");
    }

    // --- Event Listener for Folder Input Change ---
    folderInput.addEventListener('change', (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            console.log('Folder selected:', files);

            // --- UI Updates ---
            homeScreen.classList.remove('active');
            mainIdeView.classList.add('active');
            recordButton.disabled = false;
            if (recordHint) recordHint.style.display = 'none';

            // --- Display Folder Name ---
            // Extract base folder name from the relative path of the first file
            let folderName = "Selected Folder"; // Default
            if (files[0].webkitRelativePath) {
                 const pathParts = files[0].webkitRelativePath.split('/');
                 if (pathParts.length > 1) {
                     folderName = pathParts[0];
                 }
            }
            folderNameDisplay.textContent = `📁 ${folderName}`;

            // --- Populate File Tree ---
            populateFileTree(files);

            // --- Add click listeners to the newly created file tree items ---
            addFileClickListeners();

        } else {
            // Reset if no folder selected (e.g., user cancelled)
            folderNameDisplay.textContent = "No folder selected";
            fileTreeElement.innerHTML = ''; // Clear tree
            recordButton.disabled = true;
            if(recordHint) recordHint.style.display = 'block';
        }
    });

    // --- Function to Build and Render File Tree ---
    function populateFileTree(files) {
        fileTreeElement.innerHTML = ''; // Clear existing tree
        const tree = buildTreeObject(files);
        renderTree(tree, fileTreeElement, 0);
    }

    // --- Helper Function to Build Intermediate Tree Object ---
    function buildTreeObject(files) {
        const tree = {};
        // Convert FileList to array and sort by path for potentially better processing order
        const sortedFiles = Array.from(files).sort((a, b) => a.webkitRelativePath.localeCompare(b.webkitRelativePath));

        sortedFiles.forEach(file => {
            // Use a fallback for path if webkitRelativePath isn't available (though it's needed for directories)
            const path = file.webkitRelativePath || file.name;
            const parts = path.split('/');
            let currentLevel = tree;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                // If it's the last part, it's the file/item itself
                if (i === parts.length - 1) {
                    // Check if it's likely a file (contains a dot or doesn't exist yet)
                    // This check is imperfect for files without extensions in subdirs
                    // A more robust check might involve seeing if any other path starts with this path + '/'
                    const isLikelyFile = part.includes('.') || !currentLevel[part];
                    if (isLikelyFile && !currentLevel[part]) { // Avoid overwriting potential folders
                         currentLevel[part] = {
                            type: 'file',
                            name: part,
                            fullPath: path // Store full path for reference
                         };
                    } else if (!currentLevel[part]) { // If it doesn't exist, assume folder
                         currentLevel[part] = { type: 'folder', name: part, children: {} };
                    }
                    // If it exists as a folder and we think it's a file now, something is odd, log it.
                    else if (currentLevel[part].type === 'folder' && isLikelyFile) {
                         console.warn(`Conflict: ${part} detected as both folder and file.`);
                    }

                } else {
                    // It's a directory part
                    if (!currentLevel[part]) {
                        currentLevel[part] = { type: 'folder', name: part, children: {} };
                    } else if (currentLevel[part].type === 'file') {
                        // This case shouldn't happen often with sorted input if a file exists
                        // where a directory name should be. Handle potential conflict.
                        console.warn(`Path conflict: ${part} was expected to be a folder but seems to be a file.`);
                        // You might decide to convert it to a folder here, or log and skip.
                        // For simplicity, let's assume it's a folder if needed for structure.
                        if (!currentLevel[part].children) {
                             currentLevel[part].children = {};
                             currentLevel[part].type = 'folder';
                        }
                    }
                    // If it's already a folder, just move down
                    currentLevel = currentLevel[part].children;
                }
            }
        });
        // Remove the top-level folder name from the tree if desired
        const rootFolderName = files[0]?.webkitRelativePath?.split('/')[0];
        if (rootFolderName && tree[rootFolderName] && tree[rootFolderName].type === 'folder') {
            return tree[rootFolderName].children; // Start rendering from inside the main selected folder
        }

        return tree; // Return the whole tree if root extraction fails
    }


    // --- Helper Function to Render Tree Object to HTML ---
    function renderTree(node, parentElement, depth) {
        // Get keys and sort them (folders first, then alphabetically)
        const keys = Object.keys(node).sort((a, b) => {
            const nodeA = node[a];
            const nodeB = node[b];
            if (nodeA.type === 'folder' && nodeB.type === 'file') return -1;
            if (nodeA.type === 'file' && nodeB.type === 'folder') return 1;
            return a.localeCompare(b); // Alphabetical sort otherwise
        });

        keys.forEach(key => {
            const entry = node[key];
            const li = document.createElement('li');
            li.style.paddingLeft = `${depth * 15}px`; // Indentation based on depth

            if (entry.type === 'folder') {
                li.innerHTML = `<span class="icon">📁</span>${entry.name}`;
                li.classList.add('folder-item'); // Add class for potential styling/logic
                parentElement.appendChild(li);
                // Recursively render children if they exist
                if (entry.children && Object.keys(entry.children).length > 0) {
                    renderTree(entry.children, parentElement, depth + 1);
                }
            } else { // It's a file
                li.innerHTML = `<span class="icon">📄</span>${entry.name}`;
                li.classList.add('file-item'); // Add class for potential styling/logic
                li.dataset.filePath = entry.fullPath; // Store the full path for opening later
                parentElement.appendChild(li);
            }
        });
    }

    // --- Function to Add Click Listeners to File Items ---
    function addFileClickListeners() {
        const fileItems = fileTreeElement.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Prevent clicks on folders from triggering this if propagation isn't stopped
                if (!item.classList.contains('file-item')) return;

                // Remove active class from previously selected file
                const currentlyActive = fileTreeElement.querySelector('.active-file');
                if (currentlyActive) {
                    currentlyActive.classList.remove('active-file');
                }

                // Add active class to clicked file
                item.classList.add('active-file');

                const filePath = item.dataset.filePath;
                console.log("Clicked file:", filePath);

                 // --- TODO: Implement File Opening/Editing ---
                 // 1. Show editor area if hidden (might happen after first record)
                 if(editorArea.classList.contains('hidden')) {
                     editorArea.classList.remove('hidden');
                     // Optionally hide the initial large record button area now
                     recordArea.classList.add('hidden');
                     // Optionally show bottom bar controls now
                     bottomBar.classList.remove('hidden');
                 }

                 // 2. Update the "current file" display
                 currentFileDisplay.textContent = filePath.split('/').pop(); // Show just filename

                 // 3. Fetch file content (Placeholder - requires JS access to local files or backend)
                 //    For now, we'll just put a placeholder in the editor
                 fileEditor.value = `// Content for ${filePath} would be loaded here.\n// Actual file reading requires more advanced APIs (like File System Access API)\n// or interaction with a backend/server process.`;
                 fileEditor.disabled = false; // Ensure editor is enabled

            });
        });

         // Optional: Add listeners for folders if you want expand/collapse later
         const folderItems = fileTreeElement.querySelectorAll('.folder-item');
         folderItems.forEach(item => {
            item.addEventListener('click', (e) => {
                console.log("Clicked folder:", item.textContent.trim());
                // Implement expand/collapse logic here if desired
            });
         });
    }


    // --- Placeholder for Recording Logic ---
    recordButton.addEventListener('click', () => {
        if (recordButton.disabled) return;
        console.log("Start Recording button clicked");
        // TODO: Add backend call to START recording
        // TODO: Optionally change button text/state (e.g., show Stop)
        // TODO: Show generating overlay ON STOP
    });

    // --- Placeholder for Bottom Bar Buttons ---
     const recordAgainButton = document.getElementById('record-again-button');
     const runButton = document.getElementById('run-button');

     if(recordAgainButton) {
        recordAgainButton.addEventListener('click', () => {
             console.log("Record Another Command clicked");
             // TODO: Show generating overlay
             // TODO: Make backend call to record/process command
             // TODO: Handle backend response (update file tree if needed, hide overlay)
         });
     }

     if(runButton) {
        runButton.addEventListener('click', () => {
            console.log("Run Project clicked");
            // TODO: Make backend call to run the project
        });
     }

     // --- Placeholder for File Editing/Saving ---
     fileEditor.addEventListener('input', (e) => {
        // TODO: Implement logic to handle file changes (e.g., mark file as dirty)
        // TODO: Add save functionality (Ctrl+S or a save button) -> requires backend or File System Access API
        console.log("Editor content changed for:", currentFileDisplay.textContent);
     });


}); // End DOMContentLoaded