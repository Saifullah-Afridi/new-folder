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
  Portal,
  Flex,
  Spinner,
  Card,
  CardBody,
  Text,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { FaBell, FaTrash } from "react-icons/fa";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

const Doctor = () => {
  const [visits, setVisits] = useState([]);
  const [editingVisit, setEditingVisit] = useState(null);
  const [patientName, setPatientName] = useState(
    editingVisit?.patient?.patientName || null
  );
  const [nic, setNIC] = useState(editingVisit?.patient?.NIC || null);
  const [prescription, setPrescription] = useState("");
  const [tests, setTests] = useState("");
  const [medicines, setMedicines] = useState("");
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loadingDelete, setLoadingDelete] = useState(null);
  const [showAllRecordsModal, setShowAllRecordsModal] = useState(false);
  const [previousVisits, setPreviousVisits] = useState([]);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const contractAddress = "0x747dC137742531Fb62906696A09f433992a9B616";
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/v1/patient/todays-patients"
        );
        // setVisits(
        //   response?.data?.visits?.filter((visit) => visit.status !== "complete")
        // );
        setVisits(response?.data?.visits);
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
      socket.emit("removeVisit", { _id: visitId });
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
      const NIC = editingVisit?.patient?.NIC;
      const visitDate = new Date().toISOString(); // Current date in seconds
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

        try {
          const contract = new web3.eth.Contract(
            PatientDataStorage,
            contractAddress
          );

          const accounts = await web3.eth.getAccounts();
          const accountToUse = accounts[0];

          await contract.methods
            .storePatientData(NIC, prescription, medicines, tests, visitDate)
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
  const handleViewPreviousRecords = async () => {
    const patientNIC = editingVisit?.patient?.NIC;

    setShowAllRecordsModal(true);
    setIsLoadingPrevious(true);
    if (typeof window.ethereum !== "undefined") {
      const web3 = new Web3(window.ethereum);

      try {
        const contract = new web3.eth.Contract(
          PatientDataStorage,
          contractAddress
        );

        const accounts = await web3.eth.getAccounts();
        const accountToUse = accounts[0];

        const visitRecords = await contract.methods
          .getVisitsByNIC(patientNIC)
          .call({ from: accountToUse });

        console.log(visitRecords);
        setPreviousVisits(visitRecords);
        setIsLoadingPrevious(false);
      } catch (error) {
        toast({
          title: "Error",
          description: { error },
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsLoadingPrevious(false);
      }
    } else {
      setIsLoadingPrevious(false);
      toast({
        title: "Error",
        description: "Ethereum provider not found.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
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
            <Button
              colorScheme="blue"
              variant="outline"
              onClick={handleViewPreviousRecords}
            >
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
                placeholder="Enter medicines (e.g., Name - Dosage - Duration)"
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

            <Box display="flex" gap={3}>
              <Button
                flex={1}
                variant="outline"
                colorScheme="red"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button flex={1} colorScheme="blue" onClick={handleComplete}>
                Create
              </Button>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
      <Modal
        isOpen={showAllRecordsModal}
        onClose={() => setShowAllRecordsModal(false)}
        size="3xl"
        motionPreset="slideInBottom"
      >
        <Portal>
          <ModalOverlay />
          <ModalContent
            width="60%"
            maxWidth="none"
            height="100vh"
            margin="0"
            px={5}
            overflowY="auto"
          >
            <Box mx="auto">
              <Heading
                textAlign="center"
                size="md"
                fontWeight="semibold"
                my={6}
                w="fit-content"
                borderBottom="2px"
              >
                Previous Visits Records
              </Heading>
            </Box>
            <HStack justify="space-between">
              <Heading
                textAlign="center"
                pl="20px"
                size="sm"
                fontWeight="semibold"
              >
                Name : {editingVisit?.patient?.patientName}
              </Heading>
              <Heading
                textAlign="center"
                pl="20px"
                size="sm"
                fontWeight="semibold"
              >
                NIC : {editingVisit?.patient?.NIC}
              </Heading>
            </HStack>
            <ModalCloseButton />
            <ModalBody
              padding="20px"
              display="flex"
              flexDirection="column"
              overflowY="auto"
              height="calc(100vh - 60px)" // Adjust height as needed
            >
              {isLoadingPrevious ? (
                <Flex justify="center" align="center">
                  <Spinner size="xl" />
                </Flex>
              ) : (
                <>
                  <Box
                    width="100%"
                    p={1}
                    bg="white"
                    borderWidth="1px"
                    borderRadius="lg"
                    shadow="md"
                  >
                    {previousVisits.map((record, index) => (
                      <Box
                        key={index}
                        borderBottom="1px solid"
                        borderColor="gray.300"
                        width="100%"
                        mt={4}
                      >
                        {/* Visit Date */}
                        <Text
                          fontSize="lg"
                          fontWeight="semibold"
                          textAlign="left"
                          color="blue.600"
                        >
                          Date of Visit:{" "}
                          {new Date(record.visitDate).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </Text>

                        {/* Patient Record Information */}
                        <Box
                          mt={2}
                          p={4}
                          bg="green.100"
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor="gray.200"
                        >
                          {/* Prescription Section */}
                          <Box mb={4}>
                            <Text
                              fontSize="md"
                              fontWeight="bold"
                              color="gray.800"
                              borderBottom="1px solid"
                              borderColor="gray.300"
                              mb={2}
                            >
                              Prescription
                            </Text>
                            <Text fontSize="sm" color="gray.700" ml={2}>
                              {record.prescription}
                            </Text>
                          </Box>

                          {/* Medicines Section */}
                          <Box mb={4}>
                            <Text
                              fontSize="md"
                              fontWeight="bold"
                              color="gray.800"
                              borderBottom="1px solid"
                              borderColor="gray.300"
                              mb={2}
                            >
                              Medicines
                            </Text>
                            <Text fontSize="sm" color="gray.700" ml={2}>
                              {record.medicines}
                            </Text>
                          </Box>

                          {/* Tests Section */}
                          <Box>
                            <Text
                              fontSize="md"
                              fontWeight="bold"
                              color="gray.800"
                              borderBottom="1px solid"
                              borderColor="gray.300"
                              mb={2}
                            >
                              Tests
                            </Text>
                            <Text fontSize="sm" color="gray.700" ml={2}>
                              {record.tests}
                            </Text>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </ModalBody>
          </ModalContent>
        </Portal>
      </Modal>
    </div>
  );
};

export default Doctor;
