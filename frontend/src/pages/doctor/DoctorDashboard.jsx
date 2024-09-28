import React, { useState, useEffect } from "react";
import axios from "axios";
import Web3 from "web3";
import PatientDataStorage from "./abis/PatientDataStorage.json"; // Ensure this path is correct
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
          response?.data?.visits?.filter((visit) => visit.status !== "complete")
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
      });
    } else {
      console.error("Socket is not connected");
    }
  };

  const handlePrescribeClick = (visit) => {
    setEditingVisit(visit);
    onOpen();
  };
  const handleRemove = async (visitId) => {
    try {
      // Filter out the removed visit from the list
      setVisits((prevVisits) =>
        prevVisits.filter((visit) => visit._id !== visitId)
      );

      toast({
        title: "Visit Removed",
        description: "The visit has been successfully removed.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove the visit.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleComplete = async () => {
    if (editingVisit) {
      const patientNIC = editingVisit?.patient?.NIC;

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
        const contractAddress = "0x4C5B4641e5e8c6808d2E397Df1F05b2070FCf5dA";

        try {
          const contract = new web3.eth.Contract(
            PatientDataStorage,
            contractAddress
          );

          const accounts = await web3.eth.getAccounts();
          const accountToUse = accounts[0];

          await contract.methods
            .storePatientData(patientNIC, prescription, medicines, tests)
            .send({ from: accountToUse, gas: 300000 });

          toast({
            title: "Success",
            description: "Patient data stored successfully!",
            status: "success",
            duration: 5000,
            isClosable: true,
          });

          // const patientVisits = await contract.methods
          //   .getVisitsByNIC(patientNIC)
          //   .call();

          // // Create a set of existing visit IDs for comparison
          // const existingVisitIds = new Set(visits.map((visit) => visit.id));

          // const newVisits = patientVisits
          //   .map((visit) => ({
          //     patient: { NIC: patientNIC },
          //     prescription: visit.prescription,
          //     medicines: visit.medicines,
          //     tests: visit.tests,
          //     id: visit.visitId, // Use the existing visitId from the blockchain data
          //   }))
          //   .filter((visit) => !existingVisitIds.has(visit.id)); // Filter out existing visits

          // // Update visits state with new unique visits only
          // setVisits((prevVisits) => [...prevVisits, ..newVisits]);
          await axios.patch(
            `http://localhost:3000/api/v1/visit/update-status/${editingVisit._id}`,
            { status: "complete" }
          );

          // Update the visits state to reflect the updated status
          setVisits((prevVisits) =>
            prevVisits.map((visit) =>
              visit._id === editingVisit._id
                ? { ...visit, status: "complete" }
                : visit
            )
          );
        } catch (error) {
          console.error("Error in handleComplete:", error);
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
            Today's Appointments
          </Heading>
        </Box>
        {visits.length > 0 ? (
          <Table variant="simple" colorScheme="blue" size="lg">
            <Thead bgColor="green.200">
              <Tr>
                <Th>Patient Name</Th>
                <Th>NIC</Th>
                <Th>Status</Th>
                <Th>Prescribe</Th>
                <Th>Notify</Th>
                <Th>Remove</Th>
              </Tr>
            </Thead>
            <Tbody>
              {visits?.map((visit) => (
                <Tr key={visit._id}>
                  {" "}
                  {/* Use unique id here */}
                  <Td>{visit.patient.patientName}</Td>
                  <Td>{visit.patient.NIC}</Td>
                  <Td>{visit.status}</Td>
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
                      onClick={() => handleRemove(visit._id)}
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
              No Appointments available
            </Heading>
          </Box>
        )}
      </Box>

      {/* Modal for editing visit */}
      <Modal
        size="4xl"
        motionPreset="slideInBottom"
        isOpen={isOpen}
        onClose={handleCancel}
        closeOnOverlayClick={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            <Box>
              <Heading as="h3" size="lg" textAlign="center" mb={4}>
                Edit Prescription
              </Heading>
              <FormControl mb={4}>
                <FormLabel>Prescription</FormLabel>
                <Textarea
                  style={inputFieldStyle}
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Medicines</FormLabel>
                <Textarea
                  style={inputFieldStyle}
                  value={medicines}
                  onChange={(e) => setMedicines(e.target.value)}
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Tests</FormLabel>
                <Textarea
                  style={inputFieldStyle}
                  value={tests}
                  onChange={(e) => setTests(e.target.value)}
                />
              </FormControl>
              <HStack spacing={4} justify="center">
                <Button colorScheme="blue" onClick={handleComplete}>
                  Save Changes
                </Button>
                <Button colorScheme="gray" onClick={handleCancel}>
                  Cancel
                </Button>
              </HStack>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DoctorDashboard;
