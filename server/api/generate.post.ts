export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  // return a short, neutral skeleton
  return {
    draft: [
      "Regarding your recent coverage of climate solutions, I appreciate the focus on practical steps.",
      "As a resident of our community, I’ve seen how extreme heat and higher bills affect neighbors on fixed incomes.",
      "A straightforward way forward is to speed up clean energy and invest in efficient homes so power is reliable and affordable.",
      "I urge our representatives to support bipartisan measures that expand transmission and help households upgrade.",
      "Thank you for your attention to this issue."
    ].join(" ")
  };
});
