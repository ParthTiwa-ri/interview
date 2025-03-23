"use client";

import { createUser } from "../actions/action";

function Page() {
  async function handleClick() {
    const data = await createUser({ email: "nwe@gmail.com", name: "nwe" });
    console.log(data);
  }

  return (
    <div>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}

export default Page;
