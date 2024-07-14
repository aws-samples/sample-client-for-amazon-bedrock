import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:archive/archive_io.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shelf/shelf.dart';
import 'package:shelf_static/shelf_static.dart';
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:path/path.dart' as path;
import 'package:permission_handler/permission_handler.dart';

final rand = Random();
int portMin = 1024;
int portMax = 65535;
WebUri serverAddr = WebUri("http://localhost:8080");

Future main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // if (!kIsWeb &&
  //     kDebugMode &&
  //     defaultTargetPlatform == TargetPlatform.android) {
  //   await InAppWebViewController.setWebContentsDebuggingEnabled(kDebugMode);
  // }
  await Permission.camera.request();
  await Permission.microphone.request(); // if you need microphone permission

  final appDocDir = await getApplicationSupportDirectory();

  var webDir = Directory(path.join(appDocDir.path, "out"));
  print("IndexHtml Path=========================:" +
      path.join(webDir.path, 'index.html'));
  if (!webDir.existsSync()) {
    print("unzip...");
    var data = await rootBundle.load("assets/out.zip");
    final archive =
        ZipDecoder().decodeBuffer(InputStream(data.buffer.asUint8List()));
    await extractArchiveToDisk(archive, appDocDir.path);
  }

  var pipe = const Pipeline();
  if (kDebugMode) {
    pipe.addMiddleware(logRequests());
  }
  var handler = pipe.addHandler(
      createStaticHandler(webDir.path, defaultDocument: 'index.html'));

  late HttpServer server;
  for (int i = 0; i < 5; i++) {
    try {
      server = await shelf_io.serve(handler, serverAddr.host, serverAddr.port);
      break;
    } on SocketException catch (e) {
      print(e);
      int port = portMin + rand.nextInt(portMax - portMin);
      serverAddr = WebUri("http://localhost:$port");
    }
  }

  // Enable content compression
  server.autoCompress = true;
  print('Serving at http://${server.address.host}:${server.port}');
  runApp(const MaterialApp(home: MyApp()));
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

InAppWebViewSettings settings = InAppWebViewSettings(
    useOnDownloadStart: true,
    allowsBackForwardNavigationGestures: true,
    javaScriptEnabled: true,
    // useShouldOverrideUrlLoading: true,
    // mediaPlaybackRequiresUserGesture: false,
    // allowsInlineMediaPlayback: true,
    // useHybridComposition: true,
    // useOnLoadResource: true
    );

class _MyAppState extends State<MyApp> {
  final GlobalKey webViewKey = GlobalKey();

  InAppWebViewController? webViewController;

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false, //When false, blocks the current route from being popped.
      onPopInvoked: (bool didPop) async {
        if (didPop) {
          return;
        }
        // detect Android back button click
        final controller = webViewController;
        if (controller != null) {
          if (await controller.canGoBack()) {
            controller.goBack();
          } else {
            final bool shouldPop = await _showBackDialog(context) ?? false;
            if (shouldPop) {
              // 如果用户选择退出应用,则退出应用
              await SystemNavigator.pop();
            }
          }
        }
      },
      child: Scaffold(
          appBar: AppBar(
            title: Text('BRClient'),
            toolbarHeight: 0,
            systemOverlayStyle: const SystemUiOverlayStyle(
                systemNavigationBarColor: Color(0xffe7f8ff)),
          ),
          body: Column(children: <Widget>[
            Expanded(
              child: InAppWebView(
                key: webViewKey,
                initialUrlRequest: URLRequest(url: serverAddr),
                // initialFile:'assets/web/index.html',
                initialSettings: settings,
                onWebViewCreated: (controller) {
                  webViewController = controller;
                  // webViewController?.loadFile(
                  //     assetFilePath: 'assets/web/index.html');

                  // if (Platform.isAndroid) {
                  //   InAppWebViewController.setWebContentsDebuggingEnabled(
                  //       true); // 启用调试模式
                  // }
                },
                onDownloadStartRequest: (controller, url) async {
                  print("url================================"+url.toString());
                  if (url.url.scheme == "data") {
                    String? outputFile = await FilePicker.platform.saveFile(
                        dialogTitle: 'Please select an output file:',
                        fileName:
                            'brclient_${DateTime.now().microsecondsSinceEpoch}.txt',
                        bytes: url.url.data!.contentAsBytes());
                    print("outputFile: $outputFile");
                  }
                },
                onLongPressHitTestResult: (controller, hitTestResult) async {
                  print("hitTestResult.type==========" +
                      hitTestResult.type.toString());
                  if (hitTestResult.type ==
                      InAppWebViewHitTestResultType.IMAGE_TYPE) {
                    // 处理长按图片事件
                    final imageUrl = hitTestResult.extra;
                    if (imageUrl != null) {
                      await _saveBase64ImageToLocal(imageUrl);
                    }
                  }
                },
              ),
            ),
          ])),
    );
  }
}

/// user has dismissed the modal without tapping a button.
Future<bool?> _showBackDialog(BuildContext context) {
  return showDialog<bool>(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        title: const Text('Are you sure?'),
        content: const Text(
          'Are you sure you want to exist this application?',
        ),
        actions: <Widget>[
          TextButton(
            style: TextButton.styleFrom(
              textStyle: Theme.of(context).textTheme.labelLarge,
            ),
            child: const Text('Nevermind'),
            onPressed: () {
              Navigator.pop(context, false);
            },
          ),
          TextButton(
            style: TextButton.styleFrom(
              textStyle: Theme.of(context).textTheme.labelLarge,
            ),
            child: const Text('Leave'),
            onPressed: () {
              Navigator.pop(context, true);
            },
          ),
        ],
      );
    },
  );
}

Future<void> _saveBase64ImageToLocal(String base64Image) async {
  if (!base64Image.startsWith('data:image/png;base64,')) {
    return;
  }
  final bytes = base64.decode(base64Image.split(',').last);
  String? outputFile = await FilePicker.platform.saveFile(
      dialogTitle: 'Please select an output file:',
      fileName: 'brclient_${DateTime.now().microsecondsSinceEpoch}.png',
      bytes: bytes);
  print("Image saved to: $outputFile");
}
