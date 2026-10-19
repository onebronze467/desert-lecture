import { expect } from "chai";
import { keccak256 } from "ethers";
import { network } from "hardhat";

interface Question {
    question: string;
    options: string[];
}

it("Survey init", async () => {
    const { ethers } = await network.connect();

    const title = "막무가내 설문조사";
    const description = "중앙화된 설문조사로서, 모든 데이터는 공개되지 않으며 설문조사를 게시한자만 볼 수 있습니다.";
    const questions: Question[] = [
        {
            question: "누가 내 응답을 관리할 때 더 솔직할 수 있을까요?",
            options: [
                "구글폼 운영자",
                "탈중앙화된 블록체인 (관리주체 없으며 모든 데이터 공개)",
                "상관없음",
            ],
        },
    ];
    
    const factory = await ethers.deployContract("SurveyFactory", [
        ethers.parseEther("50"),
        ethers.parseEther("0.1"),
    ]);
    const tx = await factory.createSurvey({ title, description, targetNumber : 100, questions },
        {
            value: ethers.parseEther("100"),
        },
    );


    // const surveys = await factory.getSurveys();

    const receipt = await tx.wait();
    let surveyAddress;
    receipt?.logs.forEach(log => {
        const event = factory.interface.parseLog(log)
        if(event?.name == "SurveyCreated") {
            surveyAddress = event.args[0];
        }
    })


    // const survey = await ether.deployContract("Survey", [title, descriprtion, ...])
    const surveyC = await ethers.getContractFactory("Survey");
    const signers = await ethers.getSigners();
    const respondent = signers[0];

    if(surveyAddress) {
        const survey = await surveyC.attach(surveyAddress);
        await survey.connect(respondent);
        console.log(ethers.formatEther(await ethers.provider.getBalance(respondent)));
        const submitTx = await survey.submitAnswer({
            respondent,
            answers: [1],
        });
        await submitTx.wait();
        console.log(ethers.formatEther(await ethers.provider.getBalance(respondent)));
    }
});

it("Survey storage layout", async () => {
    const { ethers } = await network.connect();

    const title = "막무가내 설문조사";
    const description = "중앙화된 설문조사로서, 모든 데이터는 공개되지 않으며 설문조사를 게시한자만 볼 수 있습니다.";
    const questions: Question[] = [
        {
            question: "누가 내 응답을 관리할 때 더 솔직할 수 있을까요?",
            options: [
                "구글폼 운영자",
                "탈중앙화된 블록체인 (관리주체 없으며 모든 데이터 공개)",
                "상관없음",
            ],
        },
    ];
    
    
    const survey = await ethers.deployContract("Survey", [ title, description, 100, questions ],
        {
            value: ethers.parseEther("100"),
        },
    );


    const slot0Data = await ethers.provider.getStorage(survey.getAddress(), ethers.toBeHex(0, 32));
    const slot1Data = await ethers.provider.getStorage(survey.getAddress(), ethers.toBeHex(1, 32));
    const slot2Data = await ethers.provider.getStorage(survey.getAddress(), ethers.toBeHex(2, 32));
    const slot3Data = await ethers.provider.getStorage(survey.getAddress(), ethers.toBeHex(3, 32));
    const slot4Data = await ethers.provider.getStorage(survey.getAddress(), ethers.toBeHex(4, 32));
    const slot5Data = await ethers.provider.getStorage(survey.getAddress(), ethers.toBeHex(5, 32));
    const slot6Data = await ethers.provider.getStorage(survey.getAddress(), ethers.toBeHex(6, 32));


    const decodeUni = (hex: string) => Buffer.from(hex.slice(2), "hex").toString("utf8");  

    const nextHash = (hex:string, i : number) => "0x" + (BigInt(hex) + BigInt(i)).toString(16);

    console.log(slot0Data)

    console.log(decodeUni(slot0Data));

    console.log("\n--- private types ---");
    console.log(slot2Data);
    console.log(slot3Data);
    

    console.log("\n--- long string types ---");
    console.log(slot1Data);


    const pDesc = keccak256(ethers.toBeHex(1, 32));

    const desc0 = await ethers.provider.getStorage(await survey.getAddress(), pDesc);
    const desc1 = await ethers.provider.getStorage(await survey.getAddress(), nextHash(pDesc, 1));
    const desc2 = await ethers.provider.getStorage(await survey.getAddress(), nextHash(pDesc, 2));
    const desc3 = await ethers.provider.getStorage(await survey.getAddress(), nextHash(pDesc, 3));
    const desc4 = await ethers.provider.getStorage(await survey.getAddress(), nextHash(pDesc, 4));

    console.log(desc0);
    console.log(desc1);
    console.log(desc2);
    console.log(desc3);
    console.log(desc4);




    console.log("\n--- Array & Structure types ---");
    console.log("slot4Data", slot4Data);
    const pQuestions = keccak256(ethers.toBeHex(4, 32));

    const questions1 =  await ethers.provider.getStorage(survey.getAddress(), nextHash(pQuestions, 0));
    const questions1_option_array =  await ethers.provider.getStorage(survey.getAddress(), nextHash(pQuestions, 1));

    const questions2 =  await ethers.provider.getStorage(survey.getAddress(), nextHash(pQuestions, 2));
    const questions2_option_array =  await ethers.provider.getStorage(survey.getAddress(), nextHash(pQuestions, 3));


    console.log("questions1", questions1);
    console.log("questions1_option[]", questions1_option_array);
    console.log("questions2", questions2, decodeUni(questions2));
    console.log("questions2_option[]", questions2_option_array);


    console.log(slot6Data);
    const addr = "0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199";
    const mapKeyAddr = keccak256(ethers.toBeHex(addr, 32) + ethers.toBeHex(6, 32).slice(2));
    const mapp1Value = await ethers.provider.getStorage(survey.getAddress(), mapKeyAddr);
    console.log( mapp1Value);
});

describe("SurveyFactory Contract", () => {
  let factory, owner, respondent1, respondent2;

  beforeEach(async () => {
    const { ethers } = await network.connect();
    [owner, respondent1, respondent2] = await ethers.getSigners();

    factory = await ethers.deployContract("SurveyFactory", [
      ethers.parseEther("50"), // min_pool_amount
      ethers.parseEther("0.1"), // min_reward_amount
    ]);
  });

  it("should deploy with correct minimum amounts", async () => {
    // TODO: check min_pool_amount and min_reward_amount
    const { ethers } = await network.connect();

    expect(await factory.min_pool_amount()).to.equal(
        ethers.parseEther("50")
    );

    expect(await factory.min_reward_amount()).to.equal(
        ethers.parseEther("0.1")
    );
  });

  it("should create a new survey when valid values are provided", async () => {
    // TODO: prepare SurveySchema and call createSurvey with msg.value
    // TODO: check event SurveyCreated emitted
    // TODO: check surveys array length increased
    const { ethers } = await network.connect();

    const survey = {
        title: "Test Survey",
        description: "Test Description",
        targetNumber: 100,
        questions: [
            {
                question: "Question 1?",
                options: ["A", "B"],
            },
        ],
    };

    await expect(
        factory.createSurvey(survey, {
            value: ethers.parseEther("50"),
        })
    ).to.emit(factory, "SurveyCreated");

    const surveys = await factory.getSurveys();
    expect(surveys.length).to.equal(1);

  });

  it("should revert if pool amount is too small", async () => {
    // TODO: expect revert when msg.value < min_pool_amount
    const { ethers } = await network.connect();

    const survey = {
        title: "Test Survey",
        description: "Test Description",
        targetNumber: 100,
        questions: [
            {
                question: "Question 1?",
                options: ["A", "B"],
            },
        ],
    };

    await expect(
        factory.createSurvey(survey, {
            value: ethers.parseEther("49"),
        })
    ).to.be.revertedWith("Insufficient pool amount");
  });

  it("should revert if reward amount per respondent is too small", async () => {
    // TODO: expect revert when msg.value / targetNumber < min_reward_amount
    const { ethers } = await network.connect();

    const survey = {
        title: "Test Survey",
        description: "Test Description",
        targetNumber: 1000,
        questions: [
            {
                question: "Question 1?",
                options: ["A", "B"],
            },
        ],
    };

    await expect(
        factory.createSurvey(survey, {
            value: ethers.parseEther("50"),
        })
    ).to.be.revertedWith("Insufficient reward");
  });

  it("should store created surveys and return them from getSurveys", async () => {
    // TODO: create multiple surveys and check getSurveys output
    const { ethers } = await network.connect();

    const survey1 = {
        title: "Survey 1",
        description: "Description 1",
        targetNumber: 100,
        questions: [
            {
                question: "Question 1?",
                options: ["A", "B"],
            },
        ],
    };

    const survey2 = {
        title: "Survey 2",
        description: "Description 2",
        targetNumber: 200,
        questions: [
            {
                question: "Question 2?",
                options: ["Yes", "No"],
            },
        ],
    };

    await factory.createSurvey(survey1, {
        value: ethers.parseEther("50"),
    });

    await factory.createSurvey(survey2, {
        value: ethers.parseEther("50"),
    });

    const surveys = await factory.getSurveys();

    expect(surveys.length).to.equal(2);
  });
});

