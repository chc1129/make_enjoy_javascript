// 数を調べる
const check = function (num) {
    console.log(num + "は");
    if (num >= 3) {
        console.log("3未満！");
    } else {
        console.log("3以上！");
    }
};

// 関数を呼び出す
check(10);
check(3);
check(1);
