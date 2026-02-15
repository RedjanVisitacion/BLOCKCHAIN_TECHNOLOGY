// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    address public owner;
    string public electionName;

    Candidate[] private candidates;
    mapping(address => bool) public hasVoted;

    event Voted(address indexed voter, uint256 indexed candidateIndex);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor(string memory _electionName, string[] memory candidateNames) {
        require(candidateNames.length > 0, "NO_CANDIDATES");
        owner = msg.sender;
        electionName = _electionName;
        for (uint256 i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate({name: candidateNames[i], voteCount: 0}));
        }
    }

    function candidatesCount() external view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint256 index) external view returns (string memory name, uint256 voteCount) {
        require(index < candidates.length, "BAD_INDEX");
        Candidate memory c = candidates[index];
        return (c.name, c.voteCount);
    }

    function vote(uint256 candidateIndex) external {
        require(!hasVoted[msg.sender], "ALREADY_VOTED");
        require(candidateIndex < candidates.length, "BAD_INDEX");
        hasVoted[msg.sender] = true;
        candidates[candidateIndex].voteCount += 1;
        emit Voted(msg.sender, candidateIndex);
    }

    function renameElection(string calldata newName) external onlyOwner {
        electionName = newName;
    }
}
