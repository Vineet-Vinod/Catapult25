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
    const saveFileButton = document.getElementById('save-file-button');
    const IP = 'http://10.186.165.246:5000';

    let openedFilesMap = new Map(); // map filePath to File object
    let currentOpenFile = null;
    let isSaving = false;

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

            // clear previous state and map
            openedFilesMap = new Map();
            currentOpenFile = null;
            saveFileButton.disabled = true;
            fileEditor.value = ''; // clear out the editor
            currentFileDisplay.textContent = "No file open";

            fileEditor.disabled = true;
            editorArea.classList.add('hidden'); // hide the editor
            // recordArea.classList.remove('hidden'); // show the record button (maybe)
            bottomBar.classList.add('hidden'); // hide bottom bar

            Array.from(files).forEach(file => {
                const path = file.webkitRelativePath || file.name;
                if (path) {
                    openedFilesMap.set(path, file);
                } else {
                    console.warn("File object missing path information for", file);
                }
            });
            console.log("Populated openFilesMap:", openedFilesMap.size, "entries");

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
            openedFilesMap = new Map();
            currentOpenFile = null;
            saveFileButton.disabled = true;

            folderNameDisplay.textContent = "No folder selected";
            fileTreeElement.innerHTML = ''; // Clear tree
            recordButton.disabled = true;
            if(recordHint) recordHint.style.display = 'block';
            
            /*
            homeScreen.classList.add('active'); // show home screen again
            mainIdeView.classList.remove('active'); // hide IDE view
            fileEditor.value = ''; // clear editor
            currentFileDisplay.textContent = 'no file open';
            fileEditor.disabled = true;
            editorArea.classList.add('hidden');
            recordArea.classList.remove('hidden'); // ensure record area visibility matches initial state
            bottomBar.classList.add('hidden');
            */
        }
    });

    // --- Function to Build and Render File Tree ---
    function populateFileTree(files) {
        fileTreeElement.innerHTML = ''; // Clear existing tree
        const tree = buildTreeObject(files);
        renderTree(tree, fileTreeElement, 0);
    }

    // --- Helper Function to Build Intermediate Tree Object ---
    function buildTreeObject(files) { // Receives FileList
        const tree = {};
        // Sort paths from the map keys instead of the FileList directly
        const sortedPaths = Array.from(openedFilesMap.keys()).sort((a, b) => a.localeCompare(b));

        let rootFolderName = null; // Determine root folder name based on paths

        sortedPaths.forEach(path => {
            // const path = file.webkitRelativePath || file.name; // Path comes from sortedPaths
            // if (!path) return; // Already filtered by map population

            const parts = path.split('/');
                // --- MODIFIED: Determine root folder name more reliably ---
            if (rootFolderName === null && parts.length > 1) {
                rootFolderName = parts[0]; // Capture the first part as the root
            } else if (rootFolderName === null && parts.length === 1) {
                    // Handle case where only files are in the root
                    rootFolderName = ""; // Indicate root level contains files/folders directly
            }


            let currentLevel = tree;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];

                if (i === parts.length - 1) {
                    // --- MODIFIED: Rely on openedFilesMap existence for file type ---
                    // If the full path exists in our map, it's definitively a file we received.
                        if (openedFilesMap.has(path)) {
                            // Ensure we don't overwrite an existing folder structure accidentally
                            if (!currentLevel[part] || currentLevel[part].type !== 'folder') {
                                currentLevel[part] = {
                                type: 'file',
                                name: part,
                                fullPath: path
                            };
                            } else {
                                // This case (path is file, but tree has folder) should be rare with sorted input
                                console.warn(`Conflict: Path ${path} is a file, but tree already has a folder named ${part}. Prioritizing folder structure.`);
                            }
                        } else if (!currentLevel[part]) {
                            // If it's not in the map and not in the tree, assume it's a folder
                            // (Could be an empty folder implicitly defined by other paths)
                        currentLevel[part] = { type: 'folder', name: part, children: {} };
                    }
                    // If it already exists (as file or folder), leave it.

                } else {
                    // --- MODIFIED: Directory part handling ---
                    if (!currentLevel[part]) {
                        currentLevel[part] = { type: 'folder', name: part, children: {} };
                    } else if (currentLevel[part].type === 'file') {
                        // If we encounter a path part that was previously assumed to be a file
                        console.warn(`Path conflict: ${part} was treated as a file but is needed as a folder for path ${path}. Converting to folder.`);
                        currentLevel[part] = { type: 'folder', name: part, children: {} }; // Convert to folder
                    }
                    // If it's already a folder, just move down
                        // Check if children exist before trying to access them
                        if (!currentLevel[part].children) {
                        currentLevel[part].children = {}; // Ensure children object exists
                        }
                    currentLevel = currentLevel[part].children;
                }
            }
        });

        // --- MODIFIED: Root folder extraction logic ---
        // If a root folder name was identified AND it exists in the tree as a folder
        if (rootFolderName !== null && rootFolderName !== "" && tree[rootFolderName]?.type === 'folder') {
            return tree[rootFolderName].children; // Start rendering from inside the main selected folder
        }
        // If rootFolderName is "" (files at root) or extraction failed, return the whole tree
        return tree;
    }

    // --- Helper Function to Render Tree Object to HTML ---
    function renderTree(node, parentElement, depth) {
        const keys = Object.keys(node).sort((a, b) => {
            const nodeA = node[a];
            const nodeB = node[b];

            // Sort folders before files
            if (nodeA.type === 'folder' && nodeB.type === 'file') return -1;
            if (nodeA.type === 'file' && nodeB.type === 'folder') return 1;

            // Otherwise, sort alphabetically by key (name)
            return a.localeCompare(b);
        });

        keys.forEach(key => {
            const entry = node[key];
            const li = document.createElement('li');
            li.style.paddingLeft = `${depth * 15}px`; // Indentation based on depth

            if (entry.type === 'folder') {
                // Use spans for easier targeting of icon and name
                li.innerHTML = `<span class="icon toggle-icon">📁</span><span class="folder-name">${entry.name}</span>`;
                li.classList.add('folder-item');
                parentElement.appendChild(li);

                // Recursively render children *into a new UL* if they exist
                if (entry.children && Object.keys(entry.children).length > 0) {
                    const ul = document.createElement('ul');
                    ul.classList.add('nested'); // Class for styling/toggling
                    ul.style.display = 'none';  // Start collapsed
                    parentElement.appendChild(ul); // Append the UL *after* the folder's LI
                    renderTree(entry.children, ul, depth + 1); // Render children into the new UL
                }
            } else { // It's a file
                li.innerHTML = `<span class="icon">📄</span>${entry.name}`;
                li.classList.add('file-item');
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
                if (!item.classList.contains('file-item')) return;

                const currentlyActive = fileTreeElement.querySelector('.active-file');
                if (currentlyActive) {
                    currentlyActive.classList.remove('active-file');
                }
                item.classList.add('active-file');

                const filePath = item.dataset.filePath;
                console.log("Clicked file:", filePath);

    
                // retrieve the actual File object using the stored map
                const fileObject = openedFilesMap.get(filePath);

                if (!fileObject) {
                    console.error(`File object not found in map for path: ${filePath}`);
                    fileEditor.value = `Error: Could not find file data for ${filePath}.`;
                    currentFileDisplay.textContent = 'Error Loading File';
                    fileEditor.disabled = true;
                    // Ensure editor UI is visible even on error
                    editorArea.classList.remove('hidden');
                    recordArea.classList.add('hidden');
                    bottomBar.classList.remove('hidden');
                    return;
                }

                // 2. Show editor area and update display (if first file opened)
                if (editorArea.classList.contains('hidden')) {
                    editorArea.classList.remove('hidden');
                    recordArea.classList.add('hidden'); // Hide initial large record button area
                    bottomBar.classList.remove('hidden'); // Show bottom bar controls
                }
                currentOpenFile = filePath;
                currentFileDisplay.textContent = filePath.split('/').pop(); // Show just filename
                fileEditor.value = "Loading..."; // Placeholder
                fileEditor.disabled = true; // disable while loading
                saveFileButton.disabled = true; // disable save while

                // 3. Read file content asynchronously using File.text()
                fileObject.text()
                    .then(content => {
                        fileEditor.value = content; // Set content
                        fileEditor.disabled = false; // Enable editor
                        saveFileButton.disabled = false; // Enable save button

                        console.log(`Successfully loaded content for ${filePath}`);

                        // Optional: focus and move cursor to start
                        fileEditor.focus();
                        fileEditor.setSelectionRange(0, 0);
                    })
                    .catch(err => {
                        console.error(`Error reading file ${filePath}:`, err);
                        fileEditor.value = `Error loading file content: ${err.message}`;
                        currentFileDisplay.textContent = 'Error Reading File';
                        fileEditor.disabled = true; // Keep disabled on error
                    });
            });
        });

        // --- MODIFIED: Add listeners for folders (basic expand/collapse) ---
        const folderItems = fileTreeElement.querySelectorAll('.folder-item');
        folderItems.forEach(item => {
            item.addEventListener('click', (e) => {
                    // Prevent file read if click was on icon/name inside folder item
                    if (e.target.closest('.file-item')) return;

                    console.log("Clicked folder:", item.querySelector('.folder-name')?.textContent || item.textContent.trim());

                    // Find the next sibling UL element
                    const nestedList = item.nextElementSibling;
                    if (nestedList && nestedList.tagName === 'UL') {
                        // Toggle display
                        const isVisible = nestedList.style.display === 'block';
                        nestedList.style.display = isVisible ? 'none' : 'block';
                        // Toggle icon (optional)
                        const icon = item.querySelector('.toggle-icon');
                        if(icon) icon.textContent = isVisible ? '📁' : '📂';
                    }
                    // Prevent the event from bubbling up further if needed
                    e.stopPropagation();
            });
        });
    } // end of addFileClickListeners

    // --- File Editing/Saving ---
    // Add unsaved indicator on input
    fileEditor.addEventListener('input', (e) => {
        if (currentOpenFile && !isSaving) { // Only mark as dirty if a file is open and not currently saving
            const currentFileNameDisplay = currentFileDisplay.textContent;
            if (!currentFileNameDisplay.endsWith('*')) {
                currentFileDisplay.textContent += '*';
            }
            saveFileButton.disabled = false; // Ensure save is enabled when changes are made
        }
    });

    // Save on Button Click
    if (saveFileButton) {
        saveFileButton.addEventListener('click', saveCurrentFile);
    }

    // Save on Ctrl+S / Cmd+S
    fileEditor.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault(); // Prevent browser's default save action
            if (!saveFileButton.disabled && currentOpenFile) { // Only save if enabled and file open
                saveCurrentFile();
            } else {
                console.log("Save shortcut pressed, but no file open or save button disabled.");
            }
        }
    });

    // --- Function to Save the Currently Open File ---
    function saveCurrentFile() {
        if (!currentOpenFile || isSaving || fileEditor.disabled) {
            console.warn("Save conditions not met:", { currentOpenFile, isSaving, disabled: fileEditor.disabled });
            return; // Don't save if no file is open, already saving, or editor disabled
        }

        isSaving = true;
        saveFileButton.disabled = true; // Disable button during save
        const originalButtonText = saveFileButton.innerHTML;
        saveFileButton.innerHTML = '<span class="icon">⏳</span> Saving...'; // Indicate saving

        const contentToSave = fileEditor.value;
        const filePathToSave = currentOpenFile; // Use the tracked path

        console.log(`Attempting to save: ${filePathToSave}`);

        // --- Send data to backend ---
        fetch(`${IP}/save_file`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filePath: filePathToSave, // Send relative path
                content: contentToSave
            })
        })
        .then(response => {
            if (!response.ok) {
                 // Try to get error details from backend response
                 return response.text().then(text => {
                     throw new Error(`Server error: ${response.status} - ${text || 'No details'}`);
                 });
            }
            return response.json(); // Expect { success: true } or similar from backend
        })
        .then(data => {
            if (data.success) {
                console.log("File saved successfully:", filePathToSave);
                // Remove the '*' indicator from the display name
                if (currentFileDisplay.textContent.endsWith('*')) {
                    currentFileDisplay.textContent = currentFileDisplay.textContent.slice(0, -1);
                }
                // Optional: Show a brief success message/notification
            } else {
                 // Backend indicated failure
                 throw new Error(data.error || "Backend reported save failure.");
            }
        })
        .catch(error => {
            console.error('Error saving file:', error);
            alert(`Failed to save file "${filePathToSave}".\nError: ${error.message}\n\nPlease check console and backend logs.`);
            // Do not re-enable button immediately on error? Or re-enable so user can retry?
             saveFileButton.disabled = false; // Re-enable on error for retry
        })
        .finally(() => {
            // Runs after .then() or .catch()
            isSaving = false;
            // Restore button text and enable if not already re-enabled by error handler
            saveFileButton.innerHTML = originalButtonText;
            // Only re-enable if no "*" exists (meaning save was successful or no changes made since error)
            saveFileButton.disabled = currentFileDisplay.textContent.endsWith('*');
        });
    }

    // --- Microphone Recording Variables ---
    let mediaRecorder; // Will hold the MediaRecorder instance
    let audioChunks = []; // Array to store audio data chunks
    let audioStream; // Will hold the MediaStream from the microphone
    let isRecording = false; // Flag to track recording state

    // --- Function to Start Recording ---
    async function startRecording() {
        if (isRecording) {
            console.warn("Already recording.");
            return;
        }

        // --- Check for browser support ---
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Your browser does not support audio recording. Please use a modern browser like Chrome or Firefox.');
            console.error('getUserMedia not supported on this browser!');
            return; // Exit if not supported
        }

        console.log("Requesting microphone access...");
        try {
            // --- Request microphone access ---
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("Microphone access granted.");
            isRecording = true;
            audioChunks = []; // Clear previous chunks

            // --- Create MediaRecorder ---
            // You might want to specify a mimeType if your backend expects a specific format
            // e.g., { mimeType: 'audio/webm;codecs=opus' }
            mediaRecorder = new MediaRecorder(audioStream);

            // --- Event Handler: Data Available ---
            // This event fires periodically while recording, and once more when stopped.
            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                    console.log("Received audio chunk size:", event.data.size);
                }
            };

            // --- Event Handler: Recording Stopped ---
            mediaRecorder.onstop = () => {
                console.log("Recording stopped.");
                isRecording = false; // Update state *before* processing

                // --- Combine chunks into a single Blob ---
                const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/wav' });

                // --- TODO: Send the audioBlob to your backend ---
                console.log("Final audio blob created:", audioBlob);
                console.log("Blob size:", audioBlob.size);
                // Example using fetch (replace with your actual backend endpoint and logic)

                const formData = new FormData();
                formData.append('audio_file', audioBlob, 'recording.wav'); // Or .webm etc.

                // Show the generating overlay WHILE sending and waiting for response
                const generatingOverlay = document.getElementById('generating-overlay');
                generatingOverlay.classList.remove('hidden');

                fetch(`${IP}/process_audio`, {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json(); // Or response.text() depending on backend
                })
                .then(data => {
                    console.log('Backend response:', data);
                    // TODO: Handle successful backend response
                    // e.g., Update file tree, hide overlay, etc.
                    generatingOverlay.classList.add('hidden');
                    // populateFileTree(data.updatedFiles); // Assuming backend sends updated file list
                })
                .catch(error => {
                    console.error('Error sending audio to backend:', error);
                    alert('Error processing audio command. Please try again.');
                    // TODO: Handle error (e.g., hide overlay, show error message)
                    generatingOverlay.classList.add('hidden');
                });


                // --- Clean up ---
                // Stop the microphone stream tracks to turn off the mic indicator
                if (audioStream) {
                    audioStream.getTracks().forEach(track => track.stop());
                    console.log("Microphone stream stopped.");
                    audioStream = null; // Release stream reference
                }
                mediaRecorder = null; // Release recorder reference
            };

            // --- Event Handler: Recording Error ---
            mediaRecorder.onerror = event => {
                console.error('MediaRecorder error:', event.error);
                isRecording = false;
                alert(`Recording error: ${event.error.name}. Please ensure microphone permissions are granted.`);
                // Clean up on error too
                if (audioStream) {
                    audioStream.getTracks().forEach(track => track.stop());
                    audioStream = null;
                }
                mediaRecorder = null;
            };

            // --- Start recording ---
            // You can specify a timeslice (in ms) to get dataavailable events periodically
            // mediaRecorder.start(1000); // Get data every second
            mediaRecorder.start(); // Get all data at the end when stop() is called
            console.log("MediaRecorder started.");

        } catch (err) {
            console.error('Error accessing microphone:', err);
            isRecording = false; // Ensure state is correct
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                alert('Microphone permission denied. Please allow microphone access in your browser settings.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                alert('No microphone found. Please ensure a microphone is connected and enabled.');
            } else {
                alert(`Could not access microphone: ${err.name}`);
            }
            // Clean up if stream was partially acquired before error
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
                audioStream = null;
            }
        }
    }

    // --- Function to Stop Recording ---
    function stopRecording() {
        if (!isRecording || !mediaRecorder) {
            console.warn("Not recording or recorder not initialized.");
            // Even if not "recording", try to stop tracks if the stream exists
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
                console.log("Microphone stream stopped (cleanup).");
                audioStream = null;
            }
            isRecording = false; // Ensure state is correct
            return;
        }

        if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop(); // This will trigger the 'onstop' event handler we defined
            // UI update (like button text) should ideally happen AFTER the stop logic completes
            // or immediately if you prefer optimistic updates.
        } else {
            console.warn("MediaRecorder state is not 'recording':", mediaRecorder.state);
            // If inactive, still try to clean up stream
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
                console.log("Microphone stream stopped (cleanup).");
                audioStream = null;
            }
            isRecording = false;
        }
    }


    let record_button_press_count = 0; // Initialize the counter

    function record_logic() {
        // Check if the count is ODD (1, 3, 5...) -> START recording
        if (record_button_press_count % 2 !== 0) {
            console.log("Attempting to start recording...");
            startRecording(); // Call the function defined above

            // --- Optional: Immediate UI Update (Optimistic) ---
            // You might want to change the button text immediately here
            recordButton.innerHTML = '<span class="icon">🛑</span> Stop Recording';
            // Add a visual indicator class if desired
            recordButton.classList.add('recording-active'); // You'd need to define this style in CSS

        }
        // Check if the count is EVEN (2, 4, 6...) -> STOP recording
        else {
            console.log("Attempting to stop recording...");
            stopRecording(); // Call the function defined above

            // --- Optional: Immediate UI Update (Optimistic) ---
            // Change button text back. Note: The actual blob processing happens in onstop
            recordButton.innerHTML = '<span class="icon">⚫</span> Record Command';
            recordButton.classList.remove('recording-active');

            // --- Show the generating overlay ---
            // This should appear AFTER stopping, while waiting for the backend
            // The actual hiding of the overlay happens AFTER the fetch call in onstop succeeds or fails.
            const generatingOverlay = document.getElementById('generating-overlay');
            if (generatingOverlay) { // Check if element exists
            generatingOverlay.classList.remove('hidden');
            } else {
                console.error("Generating overlay element not found!");
            }
        }
    }

    recordButton.addEventListener('click', () => {
        if (recordButton.disabled) return; // Don't do anything if disabled

        record_button_press_count++; // Increment the counter on each click

        console.log(`Record button clicked. Count: ${record_button_press_count}`);

        record_logic();
    });

    // --- Placeholder for Bottom Bar Buttons ---
     const recordAgainButton = document.getElementById('record-again-button');
     const runButton = document.getElementById('run-button');

     if(recordAgainButton) {
        recordAgainButton.addEventListener('click', () => {
            if (recordAgainButton.disabled) return; // Don't do anything if disabled
    
            record_button_press_count++; // Increment the counter on each click
    
            console.log(`Record button clicked. Count: ${record_button_press_count}`);
    
            record_logic();
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


});