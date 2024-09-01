const express = require("express");
const multer = require("multer");
const path = require("path");
const Tesseract = require("tesseract.js");

const app = express();
const PORT = 8000;

const upload = multer({ dest: "uploads/" });

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.render("homepage");
});

app.post("/upload", upload.single("adharImage"), (req, res) => {
  console.log("File received:", req.file);

  Tesseract.recognize(
    req.file.path,
    "eng",
    {
      logger: (m) => console.log(m),
    }
  )
    .then(({ data: { text } }) => {
      console.log("OCR Result:", text);

      // Extract relevant information (Name, Aadhaar Number)
      const extractedInfo = extractAadhaarDetails(text);
      
      // Return the extracted information as JSON
      res.json(extractedInfo);
    })
    .catch((err) => {
      console.error("Error during OCR processing:", err);
      res.status(500).send("An error occurred while processing the image.");
    });
});

function extractAadhaarDetails(text) {
  // Define regular expressions to match patterns
  const nameRegex = /(?:Name|NAME)\s*:\s*([A-Z\s]+)/i;
  const aadhaarRegex = /\b\d{4}\s?\d{4}\s?\d{4}\b/; // Aadhaar number format: 1234 5678 9123

  // Match name and Aadhaar number using regular expressions
  const nameMatch = text.match(nameRegex);
  const aadhaarMatch = text.match(aadhaarRegex);

  // Extracted information
  const name = nameMatch ? nameMatch[1].trim() : "Name not found";
  const aadhaarNumber = aadhaarMatch ? aadhaarMatch[0].replace(/\s+/g, "") : "Aadhaar number not found";

  return {
    name,
    aadhaarNumber
  };
}

app.listen(PORT, () => {
  console.log(`Server started at PORT: ${PORT}`);
});
