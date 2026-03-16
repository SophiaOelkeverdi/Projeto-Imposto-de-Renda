import supabase from "./db.ts";

async function check() {
  const { data, error } = await supabase.from('clients').select('id, name, cpf').limit(5);
  console.log(data);
}
check();
