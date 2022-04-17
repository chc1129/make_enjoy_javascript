// ウィジェット・ライブラリを使う
// @need lib/widget

// チャット・ウィジェットを作って名前を「chat」に
const chat = new WIDGET.Chat(200, 300);

// 歌を歌う
const sing = async function () {
	for (let j = 0; j < 2; j += 1) {
		for (let i = 0; i < 3; i += 1) {
			chat.println("あれ？");
			await chat.sleep(1);  // 1秒休む
		}
		chat.println("マツムシが鳴いてるよ！");
		await chat.sleep(1);  // 1秒休む
	}
};

// 関数を呼び出す
sing();
