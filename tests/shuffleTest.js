function shuffle(items)
{
  let start = items.length - 1;  
  for(let i = start; i > 0; i--)
  {
    const j = Math.floor(Math.random() * i)
    const temp = items[i]
    items[i] = items[j];
    items[j] = temp;
  }
  return items;
}


let test = ['test1','test2','test3','test4','test5'];

console.log(shuffle(test));