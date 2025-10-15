var gk_isXlsx = false;
var gk_xlsxFileLookup = {};
var gk_fileData = {};

function filledCell(cell) {
  return cell !== '' && cell != null;
}

function loadFileData(filename) {
  if (gk_isXlsx && gk_xlsxFileLookup[filename]) {
    try {
      var workbook = XLSX.read(gk_fileData[filename], { type: 'base64' });
      var firstSheetName = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[firstSheetName];
      var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
      var filteredData = jsonData.filter(row => row.some(filledCell));
      var headerRowIndex = filteredData.findIndex((row, index) =>
        row.filter(filledCell).length >= filteredData[index + 1]?.filter(filledCell).length
      );
      if (headerRowIndex === -1 || headerRowIndex > 25) {
        headerRowIndex = 0;
      }
      var csv = XLSX.utils.aoa_to_sheet(filteredData.slice(headerRowIndex));
      csv = XLSX.utils.sheet_to_csv(csv, { header: 1 });
      return csv;
    } catch (e) {
      console.error('Error loading XLSX file:', e);
      return "";
    }
  }
  return gk_fileData[filename] || "";
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

// Page Navigation
const loginPage = document.getElementById('loginPage');
const signupPage = document.getElementById('signupPage');
const forgetPasswordPage = document.getElementById('forgetPasswordPage');
const dashboardPage = document.getElementById('dashboardPage');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const showForgetPassword = document.getElementById('showForgetPassword');

showSignup.addEventListener('click', (e) => {
  e.preventDefault();
  loginPage.classList.add('hidden');
  forgetPasswordPage.classList.add('hidden');
  signupPage.classList.remove('hidden');
});

showLogin.addEventListener('click', (e) => {
  e.preventDefault();
  signupPage.classList.add('hidden');
  forgetPasswordPage.classList.add('hidden');
  loginPage.classList.remove('hidden');
});

showForgetPassword.addEventListener('click', (e) => {
  e.preventDefault();
  loginPage.classList.add('hidden');
  signupPage.classList.add('hidden');
  forgetPasswordPage.classList.remove('hidden');
});

// Mock Database (localStorage)
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = null;

// Forget Password Logic
document.getElementById('resetPasswordBtn').addEventListener('click', () => {
  const username = document.getElementById('forgetUsername').value.trim();
  const securityQuestion = document.getElementById('forgetSecurityQuestion').value;
  const securityAnswer = document.getElementById('forgetSecurityAnswer').value.trim();
  const newPassword = document.getElementById('forgetNewPassword').value.trim();

  if (!username || !securityQuestion || !securityAnswer || !newPassword) {
    alert('Please fill in all fields.');
    return;
  }

  const userIndex = users.findIndex(user => user.username.toLowerCase() === username.toLowerCase());
  if (userIndex === -1) {
    alert('Username not found.');
    return;
  }

  const user = users[userIndex];
  if (user.securityQuestion !== securityQuestion || user.securityAnswer !== securityAnswer) {
    alert('Incorrect security question or answer.');
    return;
  }

  user.password = newPassword;
  localStorage.setItem('users', JSON.stringify(users));
  alert('Password reset successfully! Please login with your new password.');
  document.getElementById('forgetUsername').value = '';
  document.getElementById('forgetSecurityAnswer').value = '';
  document.getElementById('forgetNewPassword').value = '';
  forgetPasswordPage.classList.add('hidden');
  loginPage.classList.remove('hidden');
});

document.getElementById('cancelResetBtn').addEventListener('click', () => {
  document.getElementById('forgetUsername').value = '';
  document.getElementById('forgetSecurityAnswer').value = '';
  document.getElementById('forgetNewPassword').value = '';
  forgetPasswordPage.classList.add('hidden');
  loginPage.classList.remove('hidden');
});

// Signup Logic
document.getElementById('signupBtn').addEventListener('click', () => {
  const name = document.getElementById('signupName').value.trim();
  const username = document.getElementById('signupUsername').value.trim();
  const password = document.getElementById('signupPassword').value.trim();
  const contact = document.getElementById('signupContact').value.trim();
  const securityQuestion = document.getElementById('signupSecurityQuestion').value;
  const securityAnswer = document.getElementById('signupSecurityAnswer').value.trim();

  if (!name || !username || !password || !contact || !securityAnswer) {
    alert('Please fill in all fields.');
    return;
  }

  if (users.find(user => user.username.toLowerCase() === username.toLowerCase())) {
    alert('Username already exists.');
    return;
  }

  const user = {
    name,
    username,
    password,
    contact,
    securityQuestion,
    securityAnswer,
    facialRecords: [],
    investigationRecords: []
  };

  users.push(user);
  localStorage.setItem('users', JSON.stringify(users));
  alert('Signup successful! Please login.');
  document.getElementById('signupName').value = '';
  document.getElementById('signupUsername').value = '';
  document.getElementById('signupPassword').value = '';
  document.getElementById('signupContact').value = '';
  document.getElementById('signupSecurityAnswer').value = '';
  signupPage.classList.add('hidden');
  loginPage.classList.remove('hidden');
});

// Login Logic
document.getElementById('loginBtn').addEventListener('click', () => {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!username || !password) {
    alert('Please enter both username and password.');
    return;
  }

  const user = users.find(user => 
    user.username.toLowerCase() === username.toLowerCase() && 
    user.password === password
  );

  if (!user) {
    alert('Invalid username or password.');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    return;
  }

  currentUser = user;
  loginPage.classList.add('hidden');
  dashboardPage.classList.remove('hidden');
  displayUserInfo();
  displayInvestigationRecords();
  displayFacialRecords();
});

// Display User Info
function displayUserInfo() {
  document.getElementById('userInfo').innerHTML = `
    Name: ${currentUser.name}<br>
    Username: ${currentUser.username}<br>
    Contact: ${currentUser.contact}
  `;
}

// Section Toggling
const sections = [
  'investigationDetailsSection', 'faceRecognitionSection', 'crimeDetailsSection',
  'helpDeskSection', 'trainDataSection', 'photosSection', 'developerSection',
  'eraseDataSection'
];

function showSection(sectionId) {
  sections.forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(sectionId).classList.remove('hidden');

  if (sectionId === 'faceRecognitionSection') {
    startCamera();
  } else {
    stopCamera();
  }

  if (sectionId === 'investigationDetailsSection') {
    updateCapturedImage();
  }
}

// Navigation Buttons
document.getElementById('faceRecognitionBtn').addEventListener('click', () => showSection('faceRecognitionSection'));
document.getElementById('investigationDetailsBtn').addEventListener('click', () => showSection('investigationDetailsSection'));
document.getElementById('crimeDetailsBtn').addEventListener('click', () => showSection('crimeDetailsSection'));
document.getElementById('helpDeskBtn').addEventListener('click', () => showSection('helpDeskSection'));
document.getElementById('trainDataBtn').addEventListener('click', () => showSection('trainDataSection'));
document.getElementById('photosBtn').addEventListener('click', () => showSection('photosSection'));
document.getElementById('developerBtn').addEventListener('click', () => showSection('developerSection'));
document.getElementById('eraseDataBtn').addEventListener('click', () => showSection('eraseDataSection'));

// Camera Logic
let stream = null;
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const retakeBtn = document.getElementById('retakeBtn');
const analyzeBtn = document.getElementById('analyzeBtn');

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    video.srcObject = stream;
    video.classList.remove('hidden');
    canvas.classList.add('hidden');
    captureBtn.classList.remove('hidden');
    retakeBtn.classList.add('hidden');
    analyzeBtn.classList.add('hidden');
  } catch (error) {
    console.error('Error accessing camera:', error);
    alert('Unable to access camera. Please ensure camera permissions are granted.');
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
    video.classList.add('hidden');
  }
}

captureBtn.addEventListener('click', () => {
  if (!video.videoWidth || !video.videoHeight) {
    alert('Camera feed is not ready. Please try again.');
    return;
  }
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.classList.remove('hidden');
  video.classList.add('hidden');
  stopCamera();
  captureBtn.classList.add('hidden');
  retakeBtn.classList.remove('hidden');
  analyzeBtn.classList.remove('hidden');
});

retakeBtn.addEventListener('click', () => {
  canvas.classList.add('hidden');
  startCamera();
});

function updateCapturedImage() {
  const capturedImage = document.getElementById('capturedImage');
  const noImageText = document.getElementById('noImageText');
  if (currentUser && currentUser.facialRecords.length > 0) {
    const latestRecord = currentUser.facialRecords[currentUser.facialRecords.length - 1];
    capturedImage.src = latestRecord.photo;
    capturedImage.classList.remove('hidden');
    noImageText.classList.add('hidden');
  } else {
    capturedImage.classList.add('hidden');
    noImageText.classList.remove('hidden');
  }
}

// Investigation Save Logic
document.getElementById('saveInvestigationBtn').addEventListener('click', () => {
  const name = document.getElementById('investigationName').value.trim();
  const age = document.getElementById('investigationAge').value.trim();
  const aadhar = document.getElementById('investigationAadhar').value.trim();
  const crimeDate = document.getElementById('investigationCrimeDate').value.trim();
  const crimeTime = document.getElementById('investigationCrimeTime').value.trim();
  const suspectAddress = document.getElementById('investigationSuspectAddress').value.trim();
  const eyeWitness = document.getElementById('investigationEyeWitness').value.trim();
  const crimeDetails = document.getElementById('investigationCrimeDetails').value.trim();
  const investigationResult = document.getElementById('investigationResult');

  if (!name || !age || !aadhar || !crimeDate || !crimeTime || !suspectAddress || !eyeWitness || !crimeDetails) {
    investigationResult.textContent = 'Please fill in all fields.';
    return;
  }

  if (!currentUser || currentUser.facialRecords.length === 0) {
    investigationResult.textContent = 'No captured image available. Please use Face Recognition to capture an image first.';
    return;
  }

  // Check for duplicate Aadhar card number
  if (currentUser.investigationRecords.some(record => record.aadhar === aadhar)) {
    alert('Fake details identified: Aadhar card number already exists.');
    investigationResult.textContent = 'Aadhar card number already exists. Please verify the details.';
    return;
  }

  const latestRecord = currentUser.facialRecords[currentUser.facialRecords.length - 1];
  const investigationRecord = {
    image: latestRecord.photo,
    name,
    age,
    aadhar,
    crimeDate,
    crimeTime,
    suspectAddress,
    eyeWitness,
    crimeDetails
  };

  currentUser.investigationRecords.push(investigationRecord);
  const userIndex = users.findIndex(user => user.username.toLowerCase() === currentUser.username.toLowerCase());
  if (userIndex !== -1) {
    users[userIndex] = currentUser;
    localStorage.setItem('users', JSON.stringify(users));
  }

  displayInvestigationRecords();
  alert('Investigation details saved successfully!');
  document.getElementById('investigationName').value = '';
  document.getElementById('investigationAge').value = '';
  document.getElementById('investigationAadhar').value = '';
  document.getElementById('investigationCrimeDate').value = '';
  document.getElementById('investigationCrimeTime').value = '';
  document.getElementById('investigationSuspectAddress').value = '';
  document.getElementById('investigationEyeWitness').value = '';
  document.getElementById('investigationCrimeDetails').value = '';
  investigationResult.textContent = '';
});

function displayInvestigationRecords() {
  const crimeDetailsTable = document.getElementById('crimeDetailsTable');
  crimeDetailsTable.innerHTML = '';
  if (currentUser && currentUser.investigationRecords) {
    currentUser.investigationRecords.forEach(record => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="p-3 border"><img src="${record.image}" alt="Captured Image" class="w-16 h-16 object-cover rounded"></td>
        <td class="p-3 border">${record.name}</td>
        <td class="p-3 border">${record.age}</td>
        <td class="p-3 border">${record.aadhar}</td>
        <td class="p-3 border">${record.crimeDate}</td>
        <td class="p-3 border">${record.crimeTime}</td>
        <td class="p-3 border">${record.suspectAddress}</td>
        <td class="p-3 border">${record.eyeWitness}</td>
        <td class="p-3 border">${record.crimeDetails}</td>
      `;
      crimeDetailsTable.appendChild(row);
    });
  }
}

// Facial Recognition Analysis
analyzeBtn.addEventListener('click', async () => {
  const analysisResult = document.getElementById('analysisResult');
  const resultText = document.getElementById('resultText');
  analysisResult.classList.remove('hidden');
  resultText.textContent = 'Processing image...';
  console.log('Analyzing captured image...'); // Debug log

  try {
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    const blob = await (await fetch(imageDataUrl)).blob();
    const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });

    console.log('Processing image with mock facial recognition...'); // Debug log
    const mockResponse = await mockFacialRecognition(file, imageDataUrl);
    console.log('Mock response:', mockResponse); // Debug log
    resultText.textContent = mockResponse.message;

    if (mockResponse.message.includes('Similar image detected')) {
      alert('Similar image detected! ' + mockResponse.message);
    }

    const record = {
      personName: mockResponse.personName || 'Unknown',
      details: mockResponse.message,
      photo: imageDataUrl,
      faceHash: mockResponse.faceHash
    };
    currentUser.facialRecords.push(record);

    const userIndex = users.findIndex(user => user.username.toLowerCase() === currentUser.username.toLowerCase());
    if (userIndex !== -1) {
      users[userIndex] = currentUser;
      localStorage.setItem('users', JSON.stringify(users));
    }

    displayFacialRecords();
    showSection('investigationDetailsSection');
  } catch (error) {
    console.error('Error processing image:', error);
    resultText.textContent = 'Error processing image. Please try again.';
  }
});

async function mockFacialRecognition(file, imageDataUrl) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Generating image hash...'); // Debug log
      const faceHash = simpleHash(imageDataUrl.substring(0, 1000));
      let message = 'Image processed and stored successfully.';
      let personName = 'Unknown';

      if (currentUser && currentUser.facialRecords.length > 0) {
        const similarRecord = currentUser.facialRecords.find(record => record.faceHash === faceHash);
        if (similarRecord) {
          message = `Similar image detected. Previously identified as ${similarRecord.personName}.`;
          personName = similarRecord.personName;
        }
      }

      console.log('Mock processing complete:', { message, personName, faceHash }); // Debug log
      resolve({
        message,
        personName,
        faceHash
      });
    }, 2000);
  });
}

// Train Data
document.getElementById('trainBtn').addEventListener('click', async () => {
  const trainResult = document.getElementById('trainResult');
  trainResult.textContent = 'Training model...';
  await new Promise(resolve => setTimeout(resolve, 2000));
  trainResult.textContent = 'Training complete! Model updated with new data.';
});

function displayFacialRecords() {
  const photosTable = document.getElementById('photosTable');
  photosTable.innerHTML = '';
  if (currentUser && currentUser.facialRecords) {
    currentUser.facialRecords.forEach(record => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="p-3 border">${record.personName}</td>
        <td class="p-3 border">${record.details}</td>
        <td class="p-3 border"><img src="${record.photo}" alt="Photo" class="w-16 h-16 object-cover rounded"></td>
      `;
      photosTable.appendChild(row);
    });
  }
}

// Erase Data
document.getElementById('confirmEraseBtn').addEventListener('click', () => {
  const password = document.getElementById('erasePassword').value.trim();
  const eraseResult = document.getElementById('eraseResult');

  if (!password) {
    eraseResult.textContent = 'Please enter your password.';
    return;
  }

  if (password !== currentUser.password) {
    eraseResult.textContent = 'Incorrect password. Please try again.';
    document.getElementById('erasePassword').value = '';
    return;
  }

  currentUser.facialRecords = [];
  currentUser.investigationRecords = [];
  const userIndex = users.findIndex(user => user.username.toLowerCase() === currentUser.username.toLowerCase());
  if (userIndex !== -1) {
    users[userIndex] = currentUser;
    localStorage.setItem('users', JSON.stringify(users));
  }

  displayFacialRecords();
  displayInvestigationRecords();
  eraseResult.textContent = 'All data has been erased successfully.';
  document.getElementById('erasePassword').value = '';
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  stopCamera();
  currentUser = null;
  dashboardPage.classList.add('hidden');
  loginPage.classList.remove('hidden');
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
});