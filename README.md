# safe-sdk-tool
Command line based on safe SDK
该脚本基于safe sdk开发，用于命令行交互，目前支持查看、生成safe账号信息、查看待办、提交、签署（确认）、执行、拒绝提案的功能。

目前并不支持查看过往交易等功能，后续可能会添加。

执行脚步请进入src目录执行node index.js即可，请确保已经安装了nodejs环境。

参考链接:  
https://docs.safe.global/reference-sdk-starter-kit/overview  
https://docs.safe.global/reference-sdk-protocol-kit/overview  
https://docs.safe.global/reference-sdk-api-kit/overview

核心依赖库:  
@safe-global/sdk-starter-kit: 是基于@safe-global/protocol-kit、@safe-global/api-kit等进行构建，简化相关Safe交易模式。  
@safe-global/protocol-kit: 是与Safe smart account contracts进行交互。可以通过这个库生成相关交易，交易签名等相关Safe操作。  
@safe-global/api-kit: 是与Safe Transaction Service API(后端服务api)。  

