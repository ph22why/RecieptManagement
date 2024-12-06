import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";

const MainPage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>AWANA EVENTS</h1>
      <div style={styles.buttonContainer}>
        <Button
          variant="contained"
          color="inherit"
          style={styles.button}
          onClick={() => navigate("/register")}
        >
          참가 신청
        </Button>
        {/* <Button
          variant="contained"
          color="inherit"
          style={styles.button}
          onClick={() => navigate("/send")}
        >
          자격 확인 및 자료 제출
        </Button> */}
        <Button
          variant="contained"
          color="inherit"
          style={styles.button}
          onClick={() => navigate("/reciept")}
        >
          영수증 발급
        </Button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f9f9f9",
  },
  header: {
    fontSize: "32px",
    marginBottom: "20px",
    color: "#333",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
  },
  button: {
    fontSize: "18px",
    padding: "10px 20px",
    borderRadius: "4px",
    textTransform: "none",
  },
};

export default MainPage;
