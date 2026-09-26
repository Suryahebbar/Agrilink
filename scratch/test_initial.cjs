async function test() {
  const initial = {
    state: "Karnataka",
    gender: "Male",
    land_size: "< 1 acre"
  };
  const res = await fetch('http://localhost:3000/api/schemes/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initial)
  });
  const data = await res.json();
  console.log("Results with Male, < 1 acre, Karnataka:", data.count);
}

test();
