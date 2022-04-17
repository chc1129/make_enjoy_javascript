// ウィジェット・ライブラリを使う
// @need lib/widget

const chat = new WIDGET.Chat(200, 300);

const bringDanger = function () {
    for (let i = 0; i < 10; i += 0) {
        chat.println("Hello!");
    }
};

bringDanger();