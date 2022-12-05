const { expect } = require("chai");
const { ethers } = require("hardhat");
const { delay, fromBigNum, toBigNum, saveFiles, sign } = require("./utils.js");

describe("MasterChefV2 deploy and test", () => {
    var owner;
    var userWallet;
    var exchangeRouter, exchangeFactory, wETH;

    var MasterChefV2, LITH;
    var testTokens = [];
    // mode
    var isDeploy = true;
    var addresses = {
        exchangeRouter: "0xF491e7B69E4244ad4002BC14e878a34207E38c29",
        exchangeFactory: "0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3",
        wETH: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",
        MasterChefV2: "",
        LITH: "0xAD522217E64Ec347601015797Dd39050A2a69694",
        testTokens: ["", ""],
        lpToken: "0xD64D20339038dE9E380bc4f14442Dc965D65D633"
    }

    describe("Create UserWallet", function () {
        it("Create account", async function () {
            [owner, userWallet] = await ethers.getSigners();
            console.log(fromBigNum(await ethers.provider.getBalance(owner.address)));
            console.log(fromBigNum(await ethers.provider.getBalance(userWallet.address)));
            console.log(owner.address, userWallet.address);
        });
    });

    // describe("deploy dex", function () {
    //     it("Factory deploy", async function () {
    //         const Factory = await ethers.getContractFactory("PancakeSwapFactory");
    //         if (!isDeploy) {
    //             exchangeFactory = await Factory.deploy(owner.address);
    //             await exchangeFactory.deployed();
    //             console.log(await exchangeFactory.INIT_CODE_PAIR_HASH())
    //         } else {
    //             exchangeFactory = await Factory.attach(addresses.exchangeFactory);
    //         }
    //         console.log(exchangeFactory.address);
    //     });
    //     it("wETH deploy", async function () {
    //         const Factory = await ethers.getContractFactory("WETH");
    //         if (!isDeploy) {
    //             wETH = await Factory.deploy();
    //             await wETH.deployed();
    //         } else {
    //             wETH = await Factory.attach(addresses.wETH);
    //         }
    //         console.log(wETH.address);
    //     });
    //     it("Router deploy", async function () {
    //         const Factory = await ethers.getContractFactory("PancakeSwapRouter");
    //         if (!isDeploy) {
    //             exchangeRouter = await Factory.deploy(exchangeFactory.address, wETH.address);
    //             await exchangeRouter.deployed();
    //         } else {
    //             exchangeRouter = await Factory.attach(addresses.exchangeRouter);
    //         }
    //         console.log(exchangeRouter.address);
    //     });
    // })

    describe("deploy contract", function () {

        it("LITH token deploy", async function () {
            const Factory = await ethers.getContractFactory("Token");
            // LITH = await Factory.deploy("LITHIUM", "LITHIUM");
            // await LITH.deployed();
            LITH = Factory.attach(addresses.LITH);
        });

        // it("test tokens deploy", async function () {
        //     const Factory = await ethers.getContractFactory("Token");
        //     for (var i = 0; i < 3; i++) {
        //         let token = await Factory.deploy("testToken" + i, "TT" + i);
        //         await token.deployed();
        //         testTokens.push(token);
        //     }
        // });

        it("MasterChefV2 contract", async function () {
            const Factory = await ethers.getContractFactory("MasterChefV2");
            const latestBlock = await ethers.provider.getBlockNumber("latest");
            MasterChefV2 = await Factory.deploy(
                LITH.address,
                owner.address,
                toBigNum("10"),
                latestBlock
            );
            await MasterChefV2.deployed();
        });

        // it("add lith token", async () => {
        //     var tx = await LITH.transfer(MasterChefV2.address, toBigNum("100000000"));
        //     await tx.wait();
        // })

        // it("add liquidity", async () => {
        //     let tx = await testTokens[0].approve(exchangeRouter.address, toBigNum(1000000));
        //     await tx.wait();
        //     tx = await testTokens[1].approve(exchangeRouter.address, toBigNum(1000000));
        //     await tx.wait();

        //     tx = await exchangeRouter.addLiquidity(
        //         testTokens[0].address,
        //         testTokens[1].address,
        //         toBigNum(500000),
        //         toBigNum(1000000),
        //         0,
        //         0,
        //         owner.address,
        //         "111111111111111111111"
        //     );
        //     await tx.wait();
        //     const pairAddress = await exchangeFactory.getPair(testTokens[0].address, testTokens[1].address)
        //     testTokens.push({ address: pairAddress });
        // })

        it("config", async () => {
            var tx = await MasterChefV2.add(10, addresses.lpToken, 10, true, { gasLimit: toBigNum(200000, 0) });
            await tx.wait();
        })
    });

    if (!isDeploy) {
        describe("MasterChefV2 test", function () {
            it("deposit", async function () {
                var tx = await testTokens[0].approve(MasterChefV2.address, toBigNum("10000"));
                await tx.wait();

                tx = await MasterChefV2.deposit("0", toBigNum("10000"));
                await tx.wait();
            })
            it("withdraw", async function () {
                let blockNumber = await ethers.provider.getBlockNumber();
                console.log(blockNumber);
                const userInfo = await MasterChefV2.userInfo("0", owner.address);
                expect(userInfo.amount).to.be.equal(toBigNum(9990));

                if ((await ethers.provider.getNetwork()).chainId == 31337) {
                    console.log("hardhat ");
                    await network.provider.send("evm_increaseTime", [3600 * 24 * 365])
                    await network.provider.send("evm_mine");
                }

                const beforeBalance = await LITH.balanceOf(owner.address);
                var tx = await MasterChefV2.withdraw("0", userInfo.amount);
                await tx.wait();

                blockNumber = await ethers.provider.getBlockNumber();
                console.log(blockNumber);
                const LithBalance = await LITH.balanceOf(owner.address);
                expect(LithBalance).to.not.be.equal(beforeBalance);
            })
            it("get lp token price", async () => {
                const Factory = await ethers.getContractFactory("PancakeSwapPair");
                const pairContract = Factory.attach(testTokens[3].address);
                let token0 = await pairContract.token0();
                let token1 = await pairContract.token1();
                let reserves = await pairContract.getReserves();
                let totalSupply = await pairContract.totalSupply();
                const prices = {
                    [testTokens[0].address]: "1",
                    [testTokens[1].address]: "2",
                    [testTokens[2].address]: "1",
                }
                let lpPrice = (prices[token0] * fromBigNum(reserves[0], 18) + prices[token1] * fromBigNum(reserves[1], 18)) / fromBigNum(totalSupply, 18);
                console.log(fromBigNum(totalSupply), lpPrice);
            })
        });
    }

    describe("Save contracts", function () {
        it("save abis", async function () {
            const abis = {
                MasterChefV2: artifacts.readArtifactSync("MasterChefV2").abi,
                PairContract: artifacts.readArtifactSync("PancakeSwapPair").abi,
                ERC20: artifacts.readArtifactSync("ERC20").abi
            };
            await saveFiles("abis.json", JSON.stringify(abis, undefined, 4));
        });
        it("save addresses", async function () {
            var addresses = {
                MasterChefV2: MasterChefV2.address,
                LITH: LITH.address
            };
            // for (var i = 0; i < 4; i++) {
            //     addresses = {
            //         ...addresses,
            //         ["token" + i]: testTokens[i].address
            //     }
            // }
            await saveFiles(
                "addresses.json",
                JSON.stringify(addresses, undefined, 4)
            );
        });
    });
})