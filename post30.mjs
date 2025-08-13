const res = await fetch('http://localhost:3001/api/moments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    age: 30,
    title: 'Jetzt',
    categories: {
      'umfeld_wohnen': { notes: 'Ich wohne zur Miete in Berlin' },
      'finanzen': { notes: 'Ich habe geringe Ersparnisse' }
    }
  }),
});
const text = await res.text();
console.log(text);
