const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
  try {
    const form = new FormData();
    form.append('name', 'Test Firm');
    form.append('status_color', 'blue');
    form.append('featured', 'true');
    // fake logo
    fs.writeFileSync('testlogo.svg', '<svg></svg>');
    form.append('logo', fs.createReadStream('testlogo.svg'));

    console.log("sending update to 1");
    // PUT request
    const res = await axios.put('http://localhost:5000/api/prop-firms/1', form, {
      // Need auth? Wait, the routes have `authenticateToken`!
    });
    console.log("Success", res.data);
  } catch (err) {
    if (err.response) {
      console.error("HTTP Error:", err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
  }
}
testUpload();
