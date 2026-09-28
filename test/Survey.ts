import { expect } from "chai";
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

