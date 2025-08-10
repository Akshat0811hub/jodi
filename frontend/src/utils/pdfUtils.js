import jsPDF from "jspdf";

// Load image from URL and convert to base64
const getImageBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.3)); // compress
    };
    img.onerror = () => resolve(null);
  });
};

export const generateUserPDF = async (person, selectedFields) => {
  const doc = new jsPDF();

  // Load first photo
  let imageBase64 = null;
  if (person.photos && person.photos.length > 0) {
    const url = `http://localhost:5000/uploads/${person.photos[0]}`;
    imageBase64 = await getImageBase64(url);
  }

  // Draw first image on top-left
  if (imageBase64) {
    doc.addImage(imageBase64, "JPEG", 10, 10, 35, 35);
  }

  // Title beside image
  doc.setFontSize(16);
  doc.text(`Profile: ${person.name}`, 50, 20);

  // Fields below image
  doc.setFontSize(12);
  let y = 50;
  const fieldLabels = {
    name: "Name",
    age: "Age",
    height: "Height",
    gender: "Gender",
    religion: "Religion",
    caste: "Caste",
    maritalStatus: "Marital Status",
    country: "Country",
    state: "State",
    area: "Area",
  };

  // Show name + photo in 2 per row style
  let x = 10;
  let count = 0;
  selectedFields.forEach((field) => {
    if (person[field]) {
      doc.text(`${fieldLabels[field]}: ${person[field]}`, x, y);
      count++;
      if (count % 2 === 0) {
        y += 40;
        x = 10;
      } else {
        x = 110; // move to next column
      }
    }
  });

  doc.save(`${person.name}_profile.pdf`);
};
