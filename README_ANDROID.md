# Android Studioでの動作確認方法

このWebアプリケーションをAndroidアプリとして動作確認するための手順です。

## 1. 準備

1.  **バックエンドの起動**: PC上でSpring Bootアプリケーション (`DemoApplication`) を起動しておきます。
    *   ポートは `8080` であることを確認してください。

## 2. Android Studioプロジェクトの作成

1.  Android Studioを開き、**New Project** を選択します。
2.  **Empty Activity** (または Empty Views Activity) を選択して Next をクリックします。
3.  Name: `AnispotClient` (任意)
4.  Language: **Java**
5.  Finish をクリックしてプロジェクトを作成します。

## 3. AndroidManifest.xml の設定

インターネットアクセスを許可するために、`app/src/main/AndroidManifest.xml` に以下の権限を追加し、`usesCleartextTraffic` を有効にします（http通信のため）。

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- インターネット権限を追加 -->
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AnispotClient"
        
        <!-- HTTP通信を許可するために追加 -->
        android:usesCleartextTraffic="true" 
        
        tools:targetApi="31">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
```

## 4. レイアウトファイル (activity_main.xml)

`app/src/main/res/layout/activity_main.xml` を以下のように書き換えて、全画面WebViewにします。

```xml
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</RelativeLayout>
```

## 5. MainActivity.java の実装

`app/src/main/java/com/example/anispotclient/MainActivity.java` (パッケージ名は作成時に設定したもの) を以下のように編集します。

```java
package com.example.anispotclient;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        WebSettings webSettings = webView.getSettings();
        
        // JavaScriptを有効化
        webSettings.setJavaScriptEnabled(true);
        
        // ローカルストレージなどを有効化（必要に応じて）
        webSettings.setDomStorageEnabled(true);

        // リンククリック時にブラウザを開かないようにする
        webView.setWebViewClient(new WebViewClient());

        // AndroidエミュレーターからホストPCのlocalhostにアクセスするためのURL
        // 実機の場合はPCのIPアドレス (例: http://192.168.1.10:8080) を指定してください
        webView.loadUrl("http://10.0.2.2:8080");
    }

    // 戻るボタンでブラウザバックするように設定
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
```

## 6. 実行

1.  Android Studioでエミュレーターを起動し、アプリを実行（Run）します。
2.  アプリが起動し、PCで動いているAnispotの画面が表示されれば成功です。

## 注意点

*   **画像が表示されない場合**: `getImageUrl` 関数などが `localhost` を指していないか確認してください（今回の最適化で `window.location.origin` を使うように修正済みです）。
*   **実機でテストする場合**: PCとスマホを同じWi-Fiに接続し、URLを `http://10.0.2.2:8080` ではなく `http://<PCのIPアドレス>:8080` に変更してください。
