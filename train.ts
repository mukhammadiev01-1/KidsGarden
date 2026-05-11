// TASK ZK

function printNumbers(): void { // Function har soniyada son chiqaradi
  let i = 1; // 1 dan boshlaymiz

  const interval = setInterval(() => { // Har 1 soniyada ishlaydigan interval
    console.log(i); // Joriy sonni chiqaramiz
    i++; // Sonni oshiramiz

    if (i > 5) { // Agar 5 dan oshib ketsa
      clearInterval(interval); // Intervalni to‘xtatamiz
    } // if yopilishi
  }, 1000); // 1000 ms = 1 soniya
}

// Misol
printNumbers(); // 1,2,3,4,5 har soniyada chiqadi va to‘xtaydi


// // TASK ZJ

// function reduceNestedArray(arr: any[]): number {
//   // Function nested array qabul qiladi va yig‘indini qaytaradi
//   let sum = 0; // Yig‘indini saqlash uchun o‘zgaruvchi

//   for (let item of arr) {
//     // Array ichidagi har bir elementni tekshiramiz
//     if (Array.isArray(item)) {
//       // Agar element yana array bo‘lsa (nested)
//       sum += reduceNestedArray(item); // Recursive chaqirib ichkarisini ham qo‘shamiz
//     } else if (typeof item === 'number') {
//       // Agar oddiy number bo‘lsa
//       sum += item; // Uni yig‘indiga qo‘shamiz
//     }
//   }

//   return sum; // Umumiy yig‘indini qaytaramiz
// }

// // Misol
// console.log(reduceNestedArray([1, [1, 2, [4]]])); // 8
