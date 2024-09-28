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
    }

    mapping(address => Patient) public patients;
    mapping(string => Visit[]) public visits; // Mapping NIC to an array of Visit records

    // Function to store patient data
    function storePatientData(
        string memory _nic,
        string memory _prescription,
        string memory _medicines,
        string memory _tests
    ) public {
        // Store the patient data
        patients[msg.sender] = Patient(_nic, _prescription, _medicines, _tests);
        
        // Store the visit record
        visits[_nic].push(Visit(_prescription, _medicines, _tests));
    }

    // Function to get all visits of a patient by NIC
    function getVisitsByNIC(string memory _nic) public view returns (Visit[] memory) {
        return visits[_nic]; // Return the array of visits for the given NIC
    }
}
