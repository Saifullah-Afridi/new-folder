import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { Button, Input, Text, Box } from "@chakra-ui/react";
import PatientDataStorageABI from "./doctor/abis/PatientDataStorage.json"; // Replace with your actual ABI

const PatientRecords = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState("");
  const [contract, setContract] = useState(null);
  const [web3, setWeb3] = useState(null);

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        const contractAddress = "YOUR_CONTRACT_ADDRESS"; // Replace with your contract address
        const contractInstance = new web3Instance.eth.Contract(
          PatientDataStorageABI,
          contractAddress
        );
        setContract(contractInstance);
      } else {
        console.error("Ethereum object doesn't exist!");
      }
    };

    initWeb3();
  }, []);

  const handleGetRecords = async () => {
    if (!walletAddress) {
      setError("Please enter a wallet address.");
      return;
    }

    try {
      // Call the getMyVisits function on the contract
      const accounts = await web3.eth.getAccounts();
      const records = await contract.methods
        .getMyVisits()
        .call({ from: accounts[0] });
      setVisits(records);
      setError(""); // Clear any previous error
    } catch (err) {
      console.error(err);
      setError("Error retrieving records. Please check the wallet address.");
    }
  };

  return (
    <Box padding="4" borderWidth="1px" borderRadius="lg">
      <Text fontSize="xl" mb="4">
        Get Patient Records
      </Text>
      <Input
        placeholder="Enter your wallet address"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
        mb="4"
      />
      <Button colorScheme="teal" onClick={handleGetRecords}>
        Get Records
      </Button>

      {error && (
        <Text color="red.500" mt="4">
          {error}
        </Text>
      )}

      {visits.length > 0 && (
        <Box mt="4">
          <Text fontSize="lg">Visit Records:</Text>
          <ul>
            {visits.map((visit, index) => (
              <li key={index}>
                <Text>Prescription: {visit.prescription}</Text>
                <Text>Medicines: {visit.medicines}</Text>
                <Text>Tests: {visit.tests}</Text>
                <Text>Visit Date: {visit.visitDate}</Text>
                <hr />
              </li>
            ))}
          </ul>
        </Box>
      )}
    </Box>
  );
};

export default PatientRecords;
