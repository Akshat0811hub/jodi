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
      resolve(canvas.toDataURL("image/jpeg", 0.3)); // low quality for minimal size
    };
    img.onerror = () => resolve(null);
  });
};

export const generateUserPDF = async (person, selectedFields) => {
  const doc = new jsPDF();

  // Load first photo if available
  let imageBase64 = null;
  if (person.photos && person.photos.length > 0) {
    const url = `http://localhost:5000/uploads/${person.photos[0]}`;
    imageBase64 = await getImageBase64(url);
  }

  // Draw image if available
  if (imageBase64) {
    doc.addImage(imageBase64, "JPEG", 10, 10, 30, 30); // x, y, width, height
  }

  // Title
  doc.setFontSize(16);
  doc.text(`Profile: ${person.name}`, 50, 20); // Right of image

  // Field list
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

  selectedFields.forEach((field) => {
    if (person[field]) {
      doc.text(`${fieldLabels[field]}: ${person[field]}`, 10, y);
      y += 10;
    }
  });

  doc.save(`${person.name}_profile.pdf`);
};
