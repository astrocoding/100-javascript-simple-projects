document.addEventListener('DOMContentLoaded', () => {
  const redRange = document.getElementById('redRange');
  const greenRange = document.getElementById('greenRange');
  const blueRange = document.getElementById('blueRange');
  const colorBox = document.getElementById('colorBox');
  const rgbValue = document.getElementById('rgbValue');
  const copyButton = document.getElementById('copyButton');

  function updateColor() {
      const r = redRange.value;
      const g = greenRange.value;
      const b = blueRange.value;

      const rgb = `rgb(${r}, ${g}, ${b})`;

      colorBox.style.backgroundColor = rgb;
      rgbValue.value = rgb;
  }

  redRange.addEventListener('input', updateColor);
  greenRange.addEventListener('input', updateColor);
  blueRange.addEventListener('input', updateColor);

  copyButton.addEventListener('click', () => {
      rgbValue.select();
      document.execCommand('copy');
      alert(`Copied: ${rgbValue.value}`);
  });

  updateColor();
});
