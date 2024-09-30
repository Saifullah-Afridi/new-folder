import { BrowserRouter, Routes, Route } from "react-router-dom";
import RegistrationForm from "./pages/RegistrationForm";
import LoginPage from "./pages/LoginPage";
import WaitingRoom from "./pages/WaitingRoom";
import EditEmployee from "./components/EditEmployee";
import ReceptionistPrivateRoutes from "./components/ReceptionistPrivateRoutes";
import AdminPrivateRoutes from "./components/AdminPrivateRoutes";
import RoutesWithHeader from "./components/RoutesWithHeader";
import DoctorDashboard from "./pages/doctor/Doctor";
import AdminLayout from "./layouts/AdminLayout/AAdminLayout";
import Doctor from "./pages/doctor/Doctor";
import DoctorPrivateRoute from "./components/DoctorPrivateRoute";
import NotFound from "./components/NotFound";
import PatientRecords from "./pages/PatientRecords";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RoutesWithHeader />}>
          {/* login routes    */}
          <Route index element={<LoginPage />} />
          <Route path="/log-in" element={<LoginPage />} />
          {/* public routes */}

          {/* reciptionist routes */}
          <Route
            path="/receptionist"
            element={
              <ReceptionistPrivateRoutes>
                <RegistrationForm />
              </ReceptionistPrivateRoutes>
            }
          />
          <Route
            path="/doctor"
            element={
              <DoctorPrivateRoute>
                <Doctor />
              </DoctorPrivateRoute>
            }
          ></Route>
        </Route>

        {/* docots routes */}

        {/* admin routes  */}
        <Route element={<AdminPrivateRoutes />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="edit-employee/:id" element={<EditEmployee />} />
          </Route>
        </Route>
        <Route path="waiting-room" element={<WaitingRoom />} />
        <Route path="/patient" element={<PatientRecords />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
