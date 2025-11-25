const axios = require("axios");
const { createSignedUrl } = require("../utils/fatsecret");

async function searchFatSecretFoods(query) {
const signedUrl = createSignedUrl({
  method: "foods.search",
  format: "json",
  search_expression: query,
  region: "PH"         
});

  console.log("FatSecret URL:", signedUrl);

  const res = await axios.get(signedUrl);
  const data = res.data;


  console.log(res.data)
  return data.foods?.food?.map((f) => f.food_name) ?? [];
}


module.exports = { searchFatSecretFoods };
