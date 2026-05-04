async function test() {
  try {
    const req = await fetch('http://127.0.0.1:5001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Real Test',
        email: 'nourelhouda.abdellaoui2023@gmail.com',
        password: 'Password123!'
      })
    });
    const res = await req.json();
    console.log('Register response:', res);
  } catch(e) {
    console.error(e)
  }
}
test();
