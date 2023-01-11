document.getElementById('generate-btn').addEventListener('click', function() {
  const link = document.getElementById('link-input').value.trim();
  const qrcodeContainer = document.getElementById('qrcode');

  if (link === '') {
      alert('Please enter a link!');
      return;
  }

  qrcodeContainer.innerHTML = '';

  new QRCode(qrcodeContainer, {
      text: link,
      width: 200,
      height: 200
  });
});
