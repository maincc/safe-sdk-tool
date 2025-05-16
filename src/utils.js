import Safe, { buildSignatureBytes, buildContractSignature, getSafeContract }  from '@safe-global/protocol-kit'
import { polygon } from 'viem/chains'
import readlineSync from 'readline-sync'
import SafeApiKit from '@safe-global/api-kit'
import { ethers } from "ethers";
import { SigningMethod } from '@safe-global/types-kit'

const tx = {
  to: '0x6150F27500eff2AB91bB08780F64a8142f31E646',
  data: '0xd09de08a',
  value: '0'
};

let safeKit = null;
let apiKit = null;
let ethersWallet = null;

const setSafeKit = async () => {
    const rpcUrl = polygon.rpcUrls.default.http[0];
    const chainId = polygon.id;
    console.log("rpcUrl: ", rpcUrl);
    console.log("chainId: ", chainId);
    if(safeKit) {
        return safeKit;
    }
    const safeAddress = readlineSync.question('Enter the Safe address: ');
    const privateKey = readlineSync.question('Enter the private key of owner: ');
    safeKit = await Safe.init({
        provider: rpcUrl,
        signer: privateKey,
        safeAddress: safeAddress
    });
    ethersWallet = new ethers.Wallet(privateKey);
    return safeKit;
}

const setApiKit = async () => {
    if(apiKit) {
        return apiKit;
    }
    const chainId = polygon.id;
    apiKit = new SafeApiKit({
        chainId
    })
    return apiKit;
}

export const connectSafe = async () => {
    if(safeKit) {
        const safeAddress = readlineSync.question('Enter the Safe address: ');
        const privateKey = readlineSync.question('Enter the private key of owner: ');
        safeKit = await safeKit.connect({
            signer: privateKey,
            safeAddress: safeAddress
        })
        ethersWallet = new ethers.Wallet(privateKey);
    } else {
        await setSafeKit();
    }
    console.log("SafeKit connected");
}

const getWallet = async () => {
    if(ethersWallet) {
        return ethersWallet;
    }
    const privateKey = readlineSync.question('Enter the private key of owner: ');
    ethersWallet = new ethers.Wallet(privateKey);
    return ethersWallet;
}

const showTxInfo = (tx) => {
    console.log(`safeTxHash: ${tx.safeTxHash}`);
    console.log(`safe: ${tx.safe}`);
    console.log(`to: ${tx.to}`);
    console.log(`value: ${tx.value}`);
    console.log(`data: ${tx.data}`);
    console.log(`dataDecoded: ${JSON.stringify(tx.dataDecoded, null, 2)}`);
    console.log(`nonce: ${tx.nonce}`);
    console.log(`proposer: ${tx.proposer}`);
    console.log(`confirmationsRequired: ${tx.confirmations.length}/${tx.confirmationsRequired}`);
    console.log(`confirmations: ${JSON.stringify(tx.confirmations, null, 2)}`);
    console.log(`isExecuted: ${tx.isExecuted}`);
}

const getContract = async (safeKit) => {
  const safeVersion = safeKit.getContractVersion();
  const safeProvider = safeKit.getSafeProvider();
  const isL1SafeSingleton = safeKit.getContractManager().isL1SafeSingleton;
  const customContracts = safeKit.getContractManager().contractNetworks?.[chainId.toString()];
  const safeSingletonContract = await getSafeContract({
    safeProvider,
    safeVersion,
    isL1SafeSingleton,
    customContracts
  });
  return safeSingletonContract;
}

export const querySafeInfo = async () => {
    try {
        const safeKit = await setSafeKit();
        const apiKit = await setApiKit();
        const safeAddress = await safeKit.getAddress();
        console.log("safeAddress: ", safeAddress);
        const isSafeDeployed = await safeKit.isSafeDeployed();
        console.log("isSafeDeployed: ", isSafeDeployed);
        const ownerAddresses = await safeKit.getOwners();
        console.log("ownerAddresses: ", ownerAddresses);
        const wallet = await getWallet();
        console.log("signer: ", wallet.address);
        const nestedSafes = await apiKit.getSafesByOwner(safeAddress);
        console.log("nested safes of safe: ", nestedSafes);
        const threshold = await safeKit.getThreshold();
        console.log("threshold: ", threshold);
        const balance = await safeKit.getBalance();
        console.log("balance: ", balance);
        const version = safeKit.getContractVersion();
        console.log("version: ", version);
    } catch (error) {
        console.log("error: ", error);
    }
}

export const queryPendingTxs = async () => {
    const apiKit = await setApiKit();
    const safeKit = await setSafeKit();
    const safeAddress = await safeKit.getAddress();
    const pendingTxs = await apiKit.getPendingTransactions(safeAddress);
    for (const [index, tx] of pendingTxs.results.entries()) {
        console.log()
        console.log(`Pending Transaction ${index +1}:`);
        showTxInfo(tx);
    }
}

export const propose = async () => {
    const safeKit = await setSafeKit();
    const apiKit = await setApiKit();
    const safeAddress = await safeKit.getAddress();
    console.log("safeAddress: ", safeAddress);
    const ownersOfSafe = await safeKit.getOwners();
    console.log("owners of safe: ", JSON.stringify(ownersOfSafe, null, 2));
    const wallet = await getWallet();
    const signer = wallet.address;
    console.log("current singer address:", signer);
    const nestedSafesOfSigner = await apiKit.getSafesByOwner(signer);
    console.log("nested safes of signer:", JSON.stringify(nestedSafesOfSigner.safes, null, 2));
    let owners = ownersOfSafe.filter(owner => owner.toLowerCase() == signer.toLowerCase());
    owners = owners.concat(nestedSafesOfSigner.safes.filter(safe => ownersOfSafe.some(owner => owner.toLowerCase() === safe.toLowerCase())));
    const isSignable = owners.length >0;
    console.log("isSignable: ", isSignable);
    if(isSignable) {
      let owner = null;
      if(owners.length > 1) {
        // 选择一个owner
        console.log("请选择要签署提案的所有者:");
        for (const [index, ownerAddress] of owners.entries()) {
          console.log(`${index + 1}. ${ownerAddress}`);
        }
        const choice = readlineSync.question("请输入选择的序号: ");
        owner = owners[choice - 1];
      }else {
        owner = owners[0];
      }
      console.log("owner: ", owner);
      let safeTransaction = await safeKit.createTransaction({
        transactions: [tx]
      })
      console.log("Transactions to be submitted: ", safeTransaction.data);
      const safeTransactionHash = await safeKit.getTransactionHash(safeTransaction);
      console.log("safe transaction hash: ", safeTransactionHash);
      if(owner.toLowerCase() == signer.toLowerCase()){
        // 直接提交
        const signature = await safeKit.signHash(safeTransactionHash);
        console.log("signature: ", signature);
        try {
          const isPropose = readlineSync.question("是否提交该提案(y/n): ");
          if(isPropose !== "y") {
              console.log("取消提交");
          }else {
            console.log("开始提交提案...");
            await apiKit.proposeTransaction({
                safeAddress: safeAddress,
                safeTxHash: safeTransactionHash,
                safeTransactionData: safeTransaction.data,
                senderAddress: owner,
                senderSignature: signature.data
            })
            console.log("提交成功");
          }
        } catch (error) {
          console.log("error: ", error);
        }
      } else {
        // 待父账号签署提交
        const parentSafeKit = await safeKit.connect({
            signer: wallet.privateKey,
            safeAddress: owner
        })
        const contract = await getContract(safeKit);
        const parentSafeTransactionData = contract.encode("approveHash", [safeTransactionHash]);
        console.log("parent safe transaction data: ", parentSafeTransactionData);
        const parentSafeTransaction = await parentSafeKit.createTransaction({
            transactions: [{
                to: safeAddress,
                value: 0,
                data: parentSafeTransactionData
            }]
        })
        console.log("parent safe transaction: ", parentSafeTransaction.data);
        const parentSafeTransactionHash = await parentSafeKit.getTransactionHash(parentSafeTransaction);
        console.log("parent safe transaction hash: ", parentSafeTransactionHash);
        const parentSignature = await parentSafeKit.signHash(parentSafeTransactionHash);
        console.log("parent signature: ", parentSignature);
        try {
            const isPropose = readlineSync.question("是否提交该提案(y/n): ");
            if(isPropose !== "y") {
                console.log("取消提交");
            }else {
                console.log("开始提交提案...");
                await apiKit.proposeTransaction({
                    safeAddress: safeAddress,
                    safeTxHash: safeTransactionHash,
                    safeTransactionData: safeTransaction.data,
                    senderAddress: owner
                })
                await apiKit.proposeTransaction({
                    safeAddress: owner,
                    safeTxHash: parentSafeTransactionHash,
                    safeTransactionData: parentSafeTransaction.data,
                    senderAddress: signer,
                    senderSignature: parentSignature.data
                })
                console.log("提案已提交");
            }
        } catch (error) {
            console.log("error: ", error);
        }
      }
    }else {
      // 提示无权签署
      console.log("无权提交");
    }
}

export const confirm = async () => {
    const safeTxHash = readlineSync.question("请输入签署提案的safeTxHash: ")
    let apiKit = await setApiKit();
    let safeKit = await setSafeKit();
    const safeAddress = await safeKit.getAddress();
    console.log("safeAddress: ", safeAddress);
    const wallet = await getWallet();
    const signer = wallet.address;
    console.log("current singer address:", signer);
    const ownersOfSafe = await safeKit.getOwners();
    console.log("owners of safe: ", JSON.stringify(ownersOfSafe, null, 2));
    const nestedSafesOfSigner = await apiKit.getSafesByOwner(signer);
    console.log("nested safes of signer:", JSON.stringify(nestedSafesOfSigner.safes, null, 2));
    let owners = ownersOfSafe.filter(owner => owner.toLowerCase() == signer.toLowerCase());
    owners = owners.concat(nestedSafesOfSigner.safes.filter(safe => ownersOfSafe.some(owner => owner.toLowerCase() === safe.toLowerCase())));
    const isSignable = owners.length >0;
    console.log("isSignable: ", isSignable);
    if(isSignable) {
      // 签署提案
      let owner = null;
      if(owners.length > 1) {
        // 选择一个owner
        console.log("请选择要签署提案的所有者:");
        for (const [index, ownerAddress] of owners.entries()) {
          console.log(`${index + 1}. ${ownerAddress}`);
        }
        const choice = readlineSync.question("请输入选择的序号: ");
        owner = owners[choice - 1];
      }else {
        owner = owners[0];
      }
      console.log("owner: ", owner);
      const safeTx = await apiKit.getTransaction(safeTxHash);
      showTxInfo(safeTx);
      if(safeTx.isExecuted) {
        console.log("提案已执行");
      }else if(safeTx.confirmations.some(confirm => confirm.owner.toLowerCase() == owner.toLowerCase())){
        console.log("已签署");
      }else {
        if(owner.toLowerCase() == signer.toLowerCase()){
          // 直接签署
          const isConfirmed = readlineSync.question("是否确认该提案(y/n): ");
          if(isConfirmed !== "y") {
              console.log("取消确认");
          }else {
            console.log("开始确认提案...");
            const signature = await safeKit.signHash(safeTxHash);
            console.log("signature: ", signature);
            await apiKit.confirmTransaction(
                safeTxHash,
                signature.data,
            )
            console.log("提案确认成功");
          }
        }else {
          // 通过父账号签署
          const parentSafeKit = await safeKit.connect({
            signer: wallet.privateKey,
            safeAddress: owner
          })
          const contract = await getContract(parentSafeKit);
          const parentSafeTxData = contract.encode("approveHash", [safeTxHash]);
          const parentSafeTx = await parentSafeKit.createTransaction({
            transactions: [{
              to: safeAddress,
              value: 0,
              data: parentSafeTxData
            }]
          });
          console.log("parent safe transaction: ", parentSafeTx.data);
          const parentSafeTxHash = await parentSafeKit.getTransactionHash(parentSafeTx);
          console.log("parent safe transaction hash: ", parentSafeTxHash);
          const parentSignature = await parentSafeKit.signHash(parentSafeTxHash);
          console.log("parent signature: ", parentSignature);
          try {
            const isConfirmed = readlineSync.question(`是否通过${owner}确认该提案(y/n):`);
            if(isConfirmed !== "y") {
              console.log("取消确认");
            }else {
              console.log(`开始向${owner}提交提案...`);
              await apiKit.proposeTransaction({
                safeAddress: owner,
                safeTxHash: parentSafeTxHash,
                safeTransactionData: parentSafeTx.data,
                senderAddress: signer,
                senderSignature: parentSignature.data,
              })
              console.log(`提交成功，等待${owner}的其他所有者确认`);
            }
          } catch (error) {
            console.log("error: ", error);
          }
        }
      }
    }else {
      // 提示无权签署
      console.log("无权签署");
    }
}

export const execute = async () => {
  const safeTxHash = readlineSync.question("请输入要执行的提案的safeTxHash: ")
  const safeKit = await setSafeKit();
  const apiKit = await setApiKit();
  const safeTx = await apiKit.getTransaction(safeTxHash);
  showTxInfo(safeTx);
  if(safeTx.isExecuted) {
    console.log("提案已执行");
  } else {
    if(safeTx.confirmations.length >= safeTx.confirmationsRequired) {
      const isExecute = readlineSync.question("是否执行该提案(y/n): ");
      if(isExecute !== "y") {
        console.log("取消执行");
      }else {
        console.log("开始执行提案...");
        console.log("safeAddress: ", await safeKit.getAddress());
        const wallet = await getWallet();
        console.log("executor: ", wallet.address);
        const executeTxResponse = await safeKit.executeTransaction(safeTx);
        console.log("提案执行txhash: ", executeTxResponse.hash);
        console.log("提案执行成功");
      }
    }else {
      console.log("提案未达到执行条件");
    }
  }
}