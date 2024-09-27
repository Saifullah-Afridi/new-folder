<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hospital Visit Form</title>
</head>
<body>
    <h1>Register Hospital Visit</h1>
    <form id="visitForm">
        <label for="patientNic">Patient NIC:</label>
        <input type="text" id="patientNic" required><br>

        <label for="prescription">Prescription:</label>
        <input type="text" id="prescription" required><br>

        <label for="test1">Test 1:</label>
        <input type="text" id="test1"><br>

        <label for="test2">Test 2:</label>
        <input type="text" id="test2"><br>

        <label for="medicine1">Medicine 1:</label>
        <input type="text" id="medicine1"><br>

        <label for="medicine2">Medicine 2:</label>
        <input type="text" id="medicine2"><br>

        <button type="submit">Create Visit</button>
    </form>

    <script src="https://cdn.jsdelivr.net/npm/web3/dist/web3.min.js"></script>
    <script>
        const visitForm = document.getElementById('visitForm');
        visitForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Get form values
            const patientNic = document.getElementById('patientNic').value;
            const prescription = document.getElementById('prescription').value;
            const test1 = document.getElementById('test1').value;
            const test2 = document.getElementById('test2').value;
            const medicine1 = document.getElementById('medicine1').value;
            const medicine2 = document.getElementById('medicine2').value;

            // Initialize web3
            if (typeof window.ethereum !== 'undefined') {
                const web3 = new Web3(window.ethereum);
                await window.ethereum.request({ method: 'eth_requestAccounts' });

                const contractAddress = 'YOUR_CONTRACT_ADDRESS';
                const contractABI = [/* Your contract ABI here */];
                const contract = new web3.eth.Contract(contractABI, contractAddress);

                const accounts = await web3.eth.getAccounts();

                // Call the createVisit function
                await contract.methods.createVisit(patientNic, prescription, test1, test2, medicine1, medicine2).send({ from: accounts[0] });

                alert('Visit created successfully!');
            } else {
                alert('Please install MetaMask!');
            }
        });
    </script>
</body>
</html>
