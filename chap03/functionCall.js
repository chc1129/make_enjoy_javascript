const f1 = function (x) {
    console.log("f1");
    return x * x;
};

const f2 = function (x) {
    console.log("f2");
    const a = f1(x);
};

console.log("start");
const a = f2(10);
console.log(a);
console.log("goal");