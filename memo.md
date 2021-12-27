# Mmemo

## adRemoveFunction の　 Error

```js
function adRemove() {
  //document.getElementById("lmt_pro_ad_container_1").style.display = "none";
  //document.getElementById("lmt_pro_ad_container_2").style.display = "none";
  //document.getElementById("lmt_quotes_article").style.display = "none";

  adElemRemove("lmt_pro_ad_container_1");
  // update ad remove 210902
  adElemRemove("lmt_pro_ad_container");
  //document.getElementById("lmt_pro_ad_container").style.display = "none";
  document.getElementById("dl_quotes_container").style.display = "none";
  document.getElementById("iosAppAdPortal").style.display = "none";
}

function adElemRemove(elementId: string) {
  let htmlElement = document.getElementById(elementId);

  if (htmlElement != null) {
    htmlElement.style.display = "none";
  } else {
    console.log(`${elementId} is null`);
  }
}
```

みたいな感じで htmlElement の呼び出し入れ子にしたら

```bash
translator#en/ja/Translator:1 Uncaught ReferenceError: a is not defined
    at c (<anonymous>:1:15)
    at <anonymous>:1:201
```

ガッツリエラー吐く　なんでや
translator のエラーだからこっちの読み込んだ js と競合したみたいな感じなんかな？
まぁ現状こう書く必要性はないので素直に書きます。
