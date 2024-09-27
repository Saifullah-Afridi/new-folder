import React, { useState, useEffect } from "react";
import axios from "axios";
import Web3 from "web3";
import PatientDataStorage from "./abis/PatientDataStorage.json";
import {
  Button,
  Input,
  Textarea,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  Heading,
  HStack,
  useDisclosure,
} from "@chakra-ui/react";
import { FaBell, FaTrash } from "react-icons/fa";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

const DoctorDashboard = () => {
  const [visits, setVisits] = useState([]);
  const [editingVisit, setEditingVisit] = useState(null);
  const [prescription, setPrescription] = useState("");
  const [tests, setTests] = useState("");
  const [medicines, setMedicines] = useState("");
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loadingDelete, setLoadingDelete] = useState(null);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/v1/patient/todays-patients"
        );
        setVisits(
          response.data.visits.filter((visit) => visit.status !== "complete")
        );
      } catch (error) {
        toast({
          title: "Error fetching visits.",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };
    fetchVisits();
  }, [toast]);

  useEffect(() => {
    socket.on("notify-waiting-room", (visit) => {
      toast({
        title: "Patient notified.",
        description: `${visit.patient.patientName} is now the current patient.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    });

    return () => {
      socket.off("notify-waiting-room");
    };
  }, [toast]);

  useEffect(() => {
    if (editingVisit) {
      const {
        prescription: editPrescription,
        tests: editTests,
        medicines: editMedicines,
      } = editingVisit;
      setPrescription(editPrescription || "");
      setTests(editTests ? editTests.join(", ") : "");
      setMedicines(
        editMedicines
          ? editMedicines
              .map((m) => `${m.name} - ${m.dosage} for ${m.duration}`)
              .join(", ")
          : ""
      );
    }
  }, [editingVisit]);

  const handleNotify = (visit) => {
    if (socket.connected) {
      socket.emit("notify-waiting-room", visit, () => {
        console.log("Notification sent");
        socket.disconnect();
      });
    } else {
      console.error("Socket is not connected");
    }
  };

  const handlePrescribeClick = (visit) => {
    setEditingVisit(visit);
    onOpen();
  };
  console.log(PatientDataStorage); // Check if ABI exists
  const handleComplete = async () => {
    if (editingVisit) {
      const patientNIC = editingVisit.patient.NIC;
      if (!prescription || !tests || !medicines) {
        toast({
          title: "Error",
          description: "All fields are required.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (typeof window.ethereum !== "undefined") {
        const web3 = new Web3(window.ethereum);
        const contractAddress = "0x9ba3701ED5215b61A2F7DCA1184a4f27a79A2c17"; // Replace with your deployed contract address
        const contract = new web3.eth.Contract(
          PatientDataStorage,
          contractAddress
        );
        const accounts = await web3.eth.getAccounts();

        try {
          await contract.methods
            .storePatientData(accounts[0], prescription, medicines, tests)
            .send({ from: accounts[0] });
          toast({
            title: "Success",
            description: "Patient data stored successfully!",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          // Optionally, you can refresh the visits after storing data
          const patientData = await contract.methods
            .patients(accounts[0])
            .call();
          setVisits((prevVisits) => [...prevVisits, patientData]);
        } catch (error) {
          console.error("Error storing patient data:", error);
          toast({
            title: "Error",
            description: "Failed to store patient data.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Ethereum provider not found.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
      console.log("Patient NIC:", patientNIC);
      console.log("Prescription:", prescription);
      console.log("Medicines:", medicines);
      console.log("Tests:", tests);

      // Optionally, send this data to an API endpoint here
      // const completeData = { patientNIC, prescription, medicines, tests };
      // axios.post("/api/complete-visit", completeData);

      // Reset form and close modal after completion
      handleCancel();
    }
  };

  const handleCancel = () => {
    setEditingVisit(null);
    setPrescription("");
    setTests("");
    setMedicines("");
    onClose();
  };

  const inputFieldStyle = {
    height: "35px",
    borderWidth: "1px",
    boxShadow: "0 0 0 1px #3182ce",
    borderColor: "blue.300",
    outline: "none",
    borderRadius: "3px",
  };

  return (
    <div>
      <Box w="95%" pt={5} mx="auto">
        <Box align="center">
          <Heading
            fontWeight="semibold"
            color="gray.600"
            borderBottom="2px"
            pb="3px"
            width="fit-content"
            fontSize="2xl"
            mb={6}
          >
            Today Appointments
          </Heading>
        </Box>
        {visits.length > 0 ? (
          <Table variant="simple" colorScheme="blue" size="lg">
            <Thead bgColor="green.200">
              <Tr>
                <Th>Patient Name</Th>
                <Th>NIC</Th>
                <Th>Tests</Th>
                <Th>Prescribe</Th>
                <Th>Notify</Th>
                <Th>Remove</Th>
              </Tr>
            </Thead>
            <Tbody>
              {visits?.map((visit) => (
                <Tr key={visit._id}>
                  <Td>{visit.patient.patientName}</Td>
                  <Td>{visit.patient.NIC}</Td>
                  <Td>
                    {visit.tests
                      ? visit.tests.join(", ")
                      : "No tests available"}
                  </Td>
                  <Td>
                    <Button
                      colorScheme="blue"
                      onClick={() => handlePrescribeClick(visit)}
                    >
                      Prescribe
                    </Button>
                  </Td>
                  <Td>
                    <Button
                      leftIcon={<FaBell />}
                      colorScheme="yellow"
                      onClick={() => handleNotify(visit)}
                      aria-label="Notify"
                    >
                      Notify
                    </Button>
                  </Td>
                  <Td>
                    <Button
                      colorScheme="red"
                      leftIcon={<FaTrash />}
                      aria-label="Delete"
                      isDisabled={visit.status !== "complete"}
                      isLoading={loadingDelete === visit._id}
                    >
                      Remove
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Box
            h="90vh"
            display="flex"
            justifyContent="center"
            alignItems="center"
            flexDir="column"
          >
            <Heading
              borderRadius="7px"
              color="gray.700"
              p={4}
              fontWeight="semibold"
              bgGradient="linear(to-r , red.300 , red.400)"
              width="fit-content"
              size="md"
            >
              No Appointment is available
            </Heading>
          </Box>
        )}
      </Box>

      {/* Modal for editing visit */}
      <Modal
        motionPreset="slideInBottom"
        isOpen={isOpen}
        onClose={handleCancel}
        closeOnOverlayClick={false}
      >
        <ModalOverlay />
        <ModalContent
          width="70%"
          maxWidth="75%"
          height="100vh"
          maxHeight="100vh"
          margin="0"
          padding="0"
          overflowY="auto"
        >
          <HStack
            mt={4}
            width="90%"
            align="center"
            justifyContent="space-between"
          >
            <Heading fontSize="lg" p={4}>
              Prescribe for {editingVisit?.patient?.patientName}
            </Heading>
            <Button colorScheme="blue" variant="outline">
              View Previous Records
            </Button>
          </HStack>
          <ModalCloseButton />
          <ModalBody
            padding="4"
            display="flex"
            flexDirection="column"
            overflowY="auto"
            height="calc(100vh - 75px)"
          >
            <FormControl mb={4}>
              <FormLabel fontSize="sm" htmlFor="prescription">
                Prescription Details
              </FormLabel>
              <Textarea
                {...inputFieldStyle}
                id="prescription"
                placeholder="Enter prescription"
                value={prescription}
                height="100px"
                resize="vertical"
                onChange={(e) => setPrescription(e.target.value)}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel fontSize="sm" htmlFor="medicines">
                Medicines
              </FormLabel>
              <Textarea
                {...inputFieldStyle}
                id="medicines"
                placeholder="Enter medicines"
                value={medicines}
                height="100px"
                resize="vertical"
                onChange={(e) => setMedicines(e.target.value)}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel fontSize="sm" htmlFor="tests">
                Tests
              </FormLabel>
              <Textarea
                {...inputFieldStyle}
                id="tests"
                placeholder="Enter tests"
                value={tests}
                height="100px"
                resize="vertical"
                onChange={(e) => setTests(e.target.value)}
              />
            </FormControl>

            <HStack justify="center" spacing={4} mt={6}>
              <Button colorScheme="blue" onClick={handleComplete}>
                Mark as Complete
              </Button>
              <Button
                colorScheme="red"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DoctorDashboard;
