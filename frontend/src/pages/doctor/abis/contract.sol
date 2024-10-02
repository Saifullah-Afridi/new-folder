// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract PatientDataStorage {
    struct Patient {
        string nic;
        string prescription;
        string medicines;
        string tests;
    }

    struct Visit {
        string prescription;
        string medicines;
        string tests;
        string visitDate; // Added visitDate to store the visit date
        string walletAddress; // Optional wallet address field
    }

    mapping(address => Patient) public patients;
    mapping(string => Visit[]) public visits; // Mapping NIC to an array of Visit records

    // Hardcoded doctor address (replace this with the actual doctor's address)
    address public doctor = 0x54B07c2859778E50EDF689C625340B0A2D6912d4;

    // Function to store patient data (open to everyone)
    function storePatientData(
        string memory _nic,
        string memory _prescription,
        string memory _medicines,
        string memory _tests,
        string memory _visitDate, // Accepting visitDate
        string memory _walletAddress // Optional wallet address field
    ) public {
        // Store the patient data
        patients[msg.sender] = Patient(_nic, _prescription, _medicines, _tests);

        // Store the visit record with visitDate and optional wallet address
        visits[_nic].push(Visit(_prescription, _medicines, _tests, _visitDate, _walletAddress));
    }

    // Only the hardcoded doctor can access this function to retrieve visits by NIC
    function getVisitsByNIC(string memory _nic) public view returns (Visit[] memory) {
        require(msg.sender == doctor, "Only the doctor can access this data");
        return visits[_nic]; // Return the array of visits for the given NIC
    }

    // New function to get visits by the patient's wallet address
    function getVisitsByWalletAddress(string memory _walletAddress) public view returns (Visit[] memory) {
        Visit[] memory matchedVisits;
        uint256 count = 0;

        // Iterate over all the visits to find matches by wallet address
        for (uint256 i = 0; i < visits[patients[msg.sender].nic].length; i++) {
            if (keccak256(abi.encodePacked(visits[patients[msg.sender].nic][i].walletAddress)) == keccak256(abi.encodePacked(_walletAddress))) {
                count++;
            }
        }

        // Allocate memory for the matched visits
        matchedVisits = new Visit[](count);
        uint256 index = 0;

        // Populate the matched visits
        for (uint256 i = 0; i < visits[patients[msg.sender].nic].length; i++) {
            if (keccak256(abi.encodePacked(visits[patients[msg.sender].nic][i].walletAddress)) == keccak256(abi.encodePacked(_walletAddress))) {
                matchedVisits[index] = visits[patients[msg.sender].nic][i];
                index++;
            }
        }

        return matchedVisits;
    }

    // Function to change the doctor (admin only)
    function setDoctor(address _newDoctor) public {
        // Only the current doctor can set a new doctor
        require(msg.sender == doctor, "Only the current doctor can set a new doctor");
        doctor = _newDoctor;
    }
}
