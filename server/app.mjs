import express from "express";
import connectionPool from "./utils/db.mjs";

const app = express();
const port = 4001;

app.use(express.json());

app.get("/test", (req, res) => {
  return res.json("Server API is working 🚀");
});

app.get("/assignments", async (req, res) => {
  let results;
  try {
    results = await connectionPool.query(`SELECT * FROM assignments`);
  } catch (error) {
    console.error("Database error in GET /assignments:", error);
    return res.status(500).json({
      message: "Server could not read assignments because database issue",
    });
  }

  return res.status(200).json({
    data: results.rows,
  });
});

app.post("/assignments", async(req, res) => {
  try {
    const { title, content, category } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({
        message: "Server could not create assignment because there are missing data from client"
      });
    }
    const newAssignment = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    };

    await connectionPool.query(
      `insert into assignments ( title, content, category)
      values ($1, $2, $3)`,
      [
        newAssignment.title,
        newAssignment.content,
        newAssignment.category,
      ]
    );
    return res.status(201).json({
      message: "Created assignment sucessfully",
    });

 } catch (e) {
   return res.status(500).json({
     message: "Server could not create assignment because database connection",
   });
 }
});

app.get("/assignments/:assignmentId", async (req, res) => {
  try {
    const assignmentIdFromClient = req.params.assignmentId;
    const results = await connectionPool.query(
      `
        SELECT * FROM assignments WHERE assignment_id = $1
        `,
      [assignmentIdFromClient]
    );

    if (!results.rows[0]) {
      return res.status(404).json({
        message: `Server could not find a requested assignment`,
      });
    }

    return res.status(200).json({
      data: results.rows[0],
    });
  } catch (error) {
    console.error("❌ Error in GET /assignments/:assignmentId:", error.message);
    return res.status(500).json({
      message: "Server could not read assignment because database connection",
    });
  }
});

app.put("/assignments/:assignmentId", async (req, res) => {
  try {
    const assignmentIdFromClient = req.params.assignmentId;
    const updatedAssignment = { ...req.body, updated_at: new Date() };
    const result = await connectionPool.query(
      `
        update assignments
        set title = $2,
            content = $3,
            category = $4,
            length = $5,
            status = $6,
            updated_at = $7
        where assignment_id = $1
      `,
      [
        assignmentIdFromClient,
        updatedAssignment.title,
        updatedAssignment.content,
        updatedAssignment.category,
        updatedAssignment.length,
        updatedAssignment.status,
        updatedAssignment.updated_at,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Server could not find a requested assignment to update",
      });
    }

    return res.status(200).json({
      message: "Updated assignment sucessfully",
    });
  } catch (error) {
    console.error("❌ Error in PUT /assignments/:assignmentId:", error);
    return res.status(500).json({
      message: "Server could not read assignment because database connection",
    });
  }
});

app.delete("/assignments/:assignmentId", async (req, res) => {
  try {
    const assignmentIdFromClient = req.params.assignmentId;

    const result = await connectionPool.query(
      `DELETE FROM assignments WHERE assignment_id = $1`,
      [assignmentIdFromClient]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Server could not find a requested assignment to delete",
      });
    }

    return res.status(200).json({
      message: "Deleted assignment sucessfully",
    });
  } catch (err) {
    console.error("❌ Error in DELETE /assignments/:assignmentId:", err.message);

    return res.status(500).json({
      message: "Server could not delete assignment because database connection",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
