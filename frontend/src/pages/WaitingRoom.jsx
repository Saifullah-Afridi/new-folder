import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  VStack,
  Grid,
  Text,
} from "@chakra-ui/react";
import io from "socket.io-client";
import axios from "axios";

const WaitingRoom = () => {
  const [patients, setPatients] = useState([]);
  const [currentVisit, setCurrentVisit] = useState(null);
  const toast = useToast();
  const scrollRef = useRef(null);
  const audioRef = useRef(new Audio("/bell.mp3")); // Path to your notification sound

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/v1/patient/todays-patients"
        );

        setPatients(
          response?.data?.visits?.filter((visit) => visit.status !== "complete")
        );
      } catch (error) {
        toast({
          title: "Error fetching patients.",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    const socket = io("http://localhost:3000");

    socket.on("update-waiting-room", (visit) => {
      setCurrentVisit(visit._id);
      audioRef.current.play(); // Play the notification sound here
      toast({
        title: "New Visit Notified.",
        description: `Visit ID ${visit._id} has been notified.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    });
    socket.on("removeVisit", (data) => {
      setPatients((prevPatients) =>
        prevPatients.filter((patient) => patient._id !== data._id)
      );
      toast({
        title: "Patient Removed",
        description: `Patient with Visit ID ${data._id} has been removed.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    });
    return () => {
      socket.disconnect();
    };
  }, [toast]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer && patients.length >= 9) {
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;

      const scrollStep = 1;
      const scrollInterval = setInterval(() => {
        if (scrollContainer.scrollTop + clientHeight >= scrollHeight - 1) {
          scrollContainer.scrollTop = 0;
        } else {
          scrollContainer.scrollTop += scrollStep;
        }
      }, 50);

      return () => clearInterval(scrollInterval);
    }
  }, [patients]);

  return (
    <Box w="100%" px={6} maxW="1200px" mx="auto">
      <Heading
        fontWeight="semibold"
        color="gray.700"
        textAlign="center"
        fontSize="3xl"
        mb={6}
        borderBottom="2px solid"
        pb={2}
        borderColor="blue.400"
      >
        Waiting Room
      </Heading>

      <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap={6}>
        <Box>
          {currentVisit && (
            <Box
              p={6}
              borderRadius="md"
              mt={8}
              bgColor="green.200"
              textAlign="center"
              borderRightWidth={2}
              borderColor="blue.400"
              shadow="lg"
            >
              {patients
                .filter((patient) => patient._id === currentVisit)
                .map((patient) => (
                  <VStack key={patient._id} spacing={3}>
                    <Text fontSize="xl" fontWeight="bold" color="blue.900">
                      Current Patient
                    </Text>

                    <Text fontSize="lg" fontWeight="bold">
                      Name: {patient.patient.patientName}
                    </Text>

                    <Text fontSize="md" color="gray.700" fontWeight="bold">
                      Guardian: {patient.patient.guardianName}
                    </Text>

                    <Text fontSize="md" color="gray.700">
                      Address: {patient.patient.address}
                    </Text>

                    <Text fontSize="md" color="gray.600" mt={2}>
                      Please proceed to the Doctor Room.
                    </Text>
                  </VStack>
                ))}
            </Box>
          )}
        </Box>

        <Box>
          <Heading size="lg" mb={4} textAlign="center" color="blue.600">
            Today's Registered Patients
          </Heading>

          {patients.length > 0 ? (
            <Box
              bg="blue.100"
              maxH="400px"
              boxShadow="lg"
              rounded="md"
              p={0}
              overflow="hidden"
            >
              <Box ref={scrollRef} overflowY="auto" maxH="400px">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th bg="blue.500" color="white" fontWeight="bold">
                        Visit ID
                      </Th>
                      <Th bg="blue.500" color="white" fontWeight="bold">
                        Patient Name
                      </Th>
                      <Th bg="blue.500" color="white" fontWeight="bold">
                        Guardian Name
                      </Th>
                      <Th bg="blue.500" color="white" fontWeight="bold">
                        Status
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {patients.map((patient) => (
                      <Tr
                        key={patient._id}
                        height="50px"
                        bg="blue.50"
                        _hover={{ bg: "blue.200" }}
                      >
                        <Td p={2}>{patient._id}</Td>
                        <Td p={2}>{patient.patient.patientName}</Td>
                        <Td p={2}>{patient.patient.guardianName}</Td>
                        <Td p={2}>{patient.status}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Box>
          ) : (
            <VStack h="60vh" justify="center" align="center" spacing={6}>
              <Heading
                p={4}
                bgGradient="linear(to-r, red.300, red.500)"
                bgClip="text"
                size="lg"
              >
                No Patients Registered Today
              </Heading>
            </VStack>
          )}
        </Box>
      </Grid>
    </Box>
  );
};

export default WaitingRoom;
