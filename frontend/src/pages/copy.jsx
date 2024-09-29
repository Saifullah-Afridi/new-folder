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
  Button,
  useToast,
  Divider,
  Text,
  VStack,
  Grid,
} from "@chakra-ui/react";
import io from "socket.io-client";
import axios from "axios";

const WaitingRoom = () => {
  const [patients, setPatients] = useState([]);
  const [currentVisit, setCurrentVisit] = useState(null);
  const toast = useToast();
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/v1/patient/todays-patients"
        );
        setPatients(response?.data?.visits);
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
  }, [toast]);

  useEffect(() => {
    const socket = io("http://localhost:3000");

    // Listen for the 'notify-waiting-room' event
    socket.on("update-waiting-room", (visit) => {
      console.log("hello from there");

      setCurrentVisit(visit._id); // Update current visit ID
      toast({
        title: "New Visit Notified.",
        description: `Visit ID ${visit._id} has been notified.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    });
    return () => {
      socket.disconnect();
    };
  }, [toast]);

  const getRowBackgroundColor = (status) => {
    switch (status) {
      case "In Progress":
        return "blue.100";
      case "Pending":
        return "orange.100";
      default:
        return "white";
    }
  };

  // Automatic scrolling effect
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;

      const scrollStep = 1;
      const scrollInterval = setInterval(() => {
        if (scrollContainer.scrollTop + clientHeight >= scrollHeight - 1) {
          scrollContainer.scrollTop = 0; // Reset to top if reached the bottom
        } else {
          scrollContainer.scrollTop += scrollStep; // Scroll down
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
              mb={8}
              textAlign="center"
              bg="blue.50"
              borderWidth={1}
              borderColor="blue.400"
              shadow="lg"
            >
              <Text fontSize="xl" fontWeight="bold" color="blue.800">
                Current Patient
              </Text>
              <Text fontSize="md" color="gray.600" mt={2}>
                Please proceed to the Doctor Room.
              </Text>
            </Box>
          )}
        </Box>

        <Box>
          <Heading size="lg" mb={4} textAlign="center" color="blue.600">
            Today's Registered Patients
          </Heading>

          {patients.length > 0 ? (
            <Box
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
                      <Th>Visit ID</Th>
                      <Th>Patient Name</Th>
                      <Th>Guardian Name</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {/* Render original patients */}
                    {patients.map((patient) => (
                      <Tr
                        key={patient._id}
                        height="50px"
                        bg={getRowBackgroundColor(patient.status)}
                      >
                        <Td>{patient._id}</Td>
                        <Td>{patient.patientName}</Td>
                        <Td>{patient.guardianName}</Td>
                        <Td>{patient.status}</Td>
                      </Tr>
                    ))}

                    {patients.map((patient) => (
                      <Tr
                        key={`${patient._id}-clone`}
                        height="50px"
                        bg={getRowBackgroundColor(patient.status)}
                      >
                        <Td>{patient._id}</Td>
                        <Td>{patient.patientName}</Td>
                        <Td>{patient.status}</Td>
                        <Td>{patient.status}</Td>
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
