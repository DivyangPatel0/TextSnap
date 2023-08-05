const imageInput = document.getElementById('imageInput');
const convertButton = document.getElementById('convertButton');
const pasteContainer = document.getElementById('pasteContainer');
const pasteButton = document.getElementById('pasteButton');
const outputText = document.getElementById('outputText');
const copyButton = document.getElementById('copyButton');
const loadingSpinner = document.getElementById('loadingSpinner');
const dragDropArea = document.getElementById('dragDropArea');

convertButton.addEventListener('click', convertImageToText);
pasteButton.addEventListener('click', pasteImage);
copyButton.addEventListener('click', copyTextToClipboard);


dragDropArea.addEventListener('dragover', handleDragOver);
dragDropArea.addEventListener('drop', handleDrop);

function convertImageToText() {
    const file = imageInput.files[0];
    if (file) {
        processImage(file);
    }
}

function pasteImage() {
    if (navigator.clipboard) {
        navigator.clipboard.read().then(data => {
            const imgItem = data.find(item => item.types.includes('image/png') || item.types.includes('image/jpeg'));
            if (imgItem) {
                const imgBlob = imgItem.getType('image/png');
                const file = new File([imgBlob], 'pasted-image.png', { type: 'image/png' });
                processImage(file);
            } else {
                handleFallbackPaste();
            }
        }).catch(() => {
            handleFallbackPaste();
        });
    } else {
        handleFallbackPaste();
    }
}

function handleFallbackPaste() {
    const pasteData = pasteContainer.innerHTML;
    const imgRegex = /<img.*?src=['"](data:image\/(png|jpeg);base64,.*?)['"]/;
    const matches = pasteData.match(imgRegex);
    if (matches) {
        const mimeType = matches[2];
        const base64Data = matches[1].split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteArrays = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteArrays[i] = byteCharacters.charCodeAt(i);
        }
        const imgBlob = new Blob([byteArrays], { type: `image/${mimeType}` });
        const file = new File([imgBlob], 'pasted-image.png', { type: `image/${mimeType}` });
        processImage(file);
    } else {
        alert('No image found in clipboard.');
    }
}


function processImage(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const image = new Image();
        image.onload = function () {
            showLoadingSpinner();
            Tesseract.recognize(
                image,
                'eng',
                { logger: info => console.log(info) }
            ).then(({ data: { text } }) => {
                hideLoadingSpinner();
                outputText.value = text;
            });
        };
        image.src = event.target.result;
    };
    reader.readAsDataURL(file);
}


function copyTextToClipboard() {
    const textToCopy = outputText.value;
    console.log(textToCopy);
    
    // Use the modern Clipboard API if available (requires direct user interaction)
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                alert('Text copied to clipboard!');
            })
            .catch((error) => {
                console.error('Error copying text to clipboard:', error);
                alert('Failed to copy text to clipboard.');
            });
    } else {
        // Fallback approach for browsers that do not support the Clipboard API
        const tempTextArea = document.createElement('textarea');
        tempTextArea.style.position = 'absolute';
        tempTextArea.style.left = '-9999px';
        tempTextArea.value = textToCopy;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        
        try {
            const successful = document.execCommand('copy');
            const msg = successful ? 'Text copied to clipboard!' : 'Failed to copy text to clipboard.';
            alert(msg);
        } catch (error) {
            console.error('Error copying text to clipboard:', error);
            alert('Failed to copy text to clipboard.');
        }

        document.body.removeChild(tempTextArea);
    }
}




function showLoadingSpinner() {
    loadingSpinner.classList.remove('hidden');
}

function hideLoadingSpinner() {
    loadingSpinner.classList.add('hidden');
}
function handleDragOver(event) {
    event.preventDefault();
    dragDropArea.classList.add('dragging');
}

function handleDrop(event) {
    event.preventDefault();
    dragDropArea.classList.remove('dragging');

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            processImage(file);
        } else {
            alert('Invalid file type. Please drop an image file.');
        }
    }
}