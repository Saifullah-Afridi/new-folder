import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { Button, Input, Text, Box, Spinner, VStack } from "@chakra-ui/react";
import PatientDataStorageABI from "./doctor/abis/PatientDataStorage.json"; // Replace with your actual ABI

const PatientRecords = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // New loading state
  const [contract, setContract] = useState(null);
  const [web3, setWeb3] = useState(null);

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        const contractAddress = "0xD9AaAeE67235c76d5e0732F92Cd66077FE817A86"; // Replace with your contract address
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
      setError("Please enter a valid wallet address.");
      return;
    }

    setLoading(true); // Start loading

    try {
      const accounts = await web3.eth.getAccounts();
      const patientAddress = accounts[0];

      if (walletAddress.toLowerCase() !== patientAddress.toLowerCase()) {
        setError(
          "The entered wallet address does not match the connected wallet."
        );
        setVisits([]); // Clear previous visits
        return;
      }

      const records = await contract.methods
        .getVisitsByWalletAddress(walletAddress)
        .call({ from: patientAddress });
      setVisits(records);
      setError(""); // Clear any previous error
    } catch (err) {
      console.error(err);
      setError("Error retrieving records. Please check the wallet address.");
      setVisits([]); // Clear previous visits on error
    } finally {
      setLoading(false); // End loading
    }
  };

  return (
    <Box
      padding="6"
      borderWidth="1px"
      borderRadius="lg"
      boxShadow="lg"
      w="70%"
      mx="auto"
    >
      <Text fontSize="2xl" mb="6" fontWeight="bold">
        Retrieve Patient Records
      </Text>
      <VStack spacing={4} align="stretch">
        <Input
          placeholder="Enter your wallet address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          mb="4"
          isInvalid={!!error} // Highlight input if there is an error
        />
        <Button
          colorScheme="teal"
          onClick={handleGetRecords}
          isLoading={loading} // Show loading spinner on button
        >
          Get Records
        </Button>

        {error && (
          <Text color="red.500" mt="4">
            {error}
          </Text>
        )}

        {visits.length > 0 && !error && (
          <Box mt="4">
            <Text fontSize="lg" fontWeight="bold">
              Visit Records:
            </Text>
            {visits.map((visit, index) => (
              <Box
                key={index}
                borderWidth="1px"
                borderRadius="lg"
                p="4"
                mb="4"
                borderColor="gray.600"
              >
                <Text fontWeight="bold" fontSize="lg">
                  Visit Date:{" "}
                  {new Date(visit.visitDate).toLocaleDateString("en-US")}
                </Text>
                <Text mt="2">Prescription: {visit.prescription}</Text>
                <Text>Medicines: {visit.medicines}</Text>
                <Text>Tests: {visit.tests}</Text>
              </Box>
            ))}
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default PatientRecords;
