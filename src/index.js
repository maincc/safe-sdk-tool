import readlineSync from 'readline-sync'
import { querySafeInfo, connectSafe, generateSafeAccount, queryPendingTxs, propose, confirm, execute, reject } from './utils.js';

const enterFun = () => {
    console.log("请选择要进行的操作: 1、获取safe账号信息 2、链接safe账号 3、生成Safe账号 4、获取待办提案 5、提交提案 6、拒绝提案 7、签署提案 8、执行提案 9、退出")
    const operate = readlineSync.question("请输入操作编号: ")
    return operate;
}

(async () => {
    while(true) {
        const operate = enterFun();
        switch(operate) {
            case "1":
                await querySafeInfo();
                break;
            case "2":
                // 链接safe账号
                await connectSafe();
                break;
            case "3":
                // 生成Safe账号
                await generateSafeAccount();
                break;
            case "4":
                // 查看待签署提案
                await queryPendingTxs()
                break;
            case "5":
                // 提交提案
                await propose();
                break;
            case "6":
                // 拒绝提案
                await reject();
                break;
            case "7":
                // 签署提案
                await confirm();
                break;
            case "8":
                // 执行提案
                await execute();
                break;
            case "9":
                console.log("退出");
                process.exit(0);
            default:
                console.log("输入错误");
                process.exit(0);
        }
        console.log();
    }
})()