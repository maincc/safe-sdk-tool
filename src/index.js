import readlineSync from 'readline-sync'
import { querySafeInfo, connectSafe, queryPendingTxs, propose, confirm, execute } from './utils.js';

const enterFun = () => {
    console.log("请选择要进行的操作: 1、获取safe账号信息 2、链接safe账号 3、获取待办提案 4、提交提案 5、签署提案 6、执行提案 7、退出")
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
                // 查看待签署提案
                await queryPendingTxs()
                break;
            case "4":
                // 提交提案
                await propose();
                break;
            case "5":
                // 签署提案
                await confirm();
                break;
            case "6":
                // 执行提案
                await execute();
                break;
            case "7":
                console.log("退出");
                process.exit(0);
            default:
                console.log("输入错误");
                process.exit(0);
        }
        console.log();
    }
})()