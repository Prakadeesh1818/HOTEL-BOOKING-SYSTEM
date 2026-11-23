
import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "node:path";
import { mkdir, unlink } from "node:fs/promises";
import pool from "./config/db.js";
import {upload,uploadDir} from "./middleware/upload.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;
await mkdir(uploadDir, { recursive: true });

app.use((req, res, next) => {
    res.setHeader(
        "Access-Control-Allow-Origin",
        process.env.FRONTEND_ORIGIN || "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadDir));

async function deleteImageFile(imageUrl) {
    if ( typeof imageUrl !== "string" ||!imageUrl.startsWith("/uploads/")) {
        return;
    }
    const filename = path.basename(imageUrl);
    if (!filename || filename === "." || filename === "..") {
        return;
    }
    const filePath = path.join(uploadDir, filename);
    try {
        await unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Image deletion error:", error);
        }
    }
}
function validateHotelFields(body) {
    if (!body ||typeof body !== "object" ||Array.isArray(body)) {
        return {
            error: "Hotel details are required"
        };
    }

    const {title,description,latitude,longitude,price} = body;
    if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 150 ||
        typeof description !== "string" ||
        !description.trim() ||
        latitude === undefined ||
        latitude === null ||
        String(latitude).trim() === "" ||
        longitude === undefined ||
        longitude === null ||
        String(longitude).trim() === "" ||
        price === undefined ||
        price === null ||
        String(price).trim() === "")
         {
        return {
            error: "Please provide all required hotel details"
        };
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const parsedPrice = Number(price);

    if (
        !Number.isFinite(parsedLatitude) ||
        !Number.isFinite(parsedLongitude) ||
        !Number.isFinite(parsedPrice) ||

        parsedLatitude < -90 ||
        parsedLatitude > 90 ||

        parsedLongitude < -180 ||
        parsedLongitude > 180 ||

        parsedPrice <= 0
    ) {
        return {
            error: "Invalid latitude, longitude or price"
        };
    }

    return {
        data: {
            title: title.trim(),
            description: description.trim(),
            latitude: parsedLatitude,
            longitude: parsedLongitude,
            price: parsedPrice
        }
    };

}

app.get("/", (req, res) => {

    return res.status(200).send(
        "Hotel API is running"
    );

});

app.get("/api/hotels", async (req, res) => {

    const {
        title,
        minPrice,
        maxPrice,
        page,
        limit
    } = req.query;

    
    const queryValues = [
        title,
        minPrice,
        maxPrice,
        page,
        limit
    ];

    if (
        queryValues.some(
            value =>
                value !== undefined &&
                typeof value !== "string"
        )
    ) {
        return res.status(400).json({
            message: "Invalid query parameters"
        });
    }

    if (title !== undefined && title.length > 150) {
        return res.status(400).json({
            message: "Search title is too long"
        });
    }

    
    const pageNumber =
        page === undefined ? 1 : Number(page);

    const pageSize =
        limit === undefined ? 4 : Number(limit);

    if (
        !Number.isSafeInteger(pageNumber) ||
        pageNumber < 1 ||

        !Number.isSafeInteger(pageSize) ||
        pageSize < 1 ||
        pageSize > 100
    ) {
        return res.status(400).json({
            message: "Invalid page or limit"
        });
    }

    
    const hasMin = minPrice !== undefined;
    const hasMax = maxPrice !== undefined;

    const min = hasMin ? Number(minPrice) : null;
    const max = hasMax ? Number(maxPrice) : null;

    if (
        (hasMin && (
            minPrice.trim() === "" ||
            !Number.isFinite(min) ||
            min < 0
        )) ||

        (hasMax && (
            maxPrice.trim() === "" ||
            !Number.isFinite(max) ||
            max < 0
        ))
    ) {
        return res.status(400).json({
            message: "Invalid price values"
        });
    }

    if (hasMin && hasMax && min > max) {
        return res.status(400).json({
            message: "Minimum price cannot exceed maximum price"
        });
    }

    
    const offset = (pageNumber - 1) * pageSize;

    if (!Number.isSafeInteger(offset)) {
        return res.status(400).json({
            message: "Requested page is too large"
        });
    }

    try {

        
        const conditions = [];
        const values = [];

        
        if (title !== undefined && title.trim()) {

            values.push(`%${title.trim()}%`);

            conditions.push(
                `title ILIKE $${values.length}`
            );

        }

        
        if (hasMin) {

            values.push(min);

            conditions.push(
                `price >= $${values.length}`
            );

        }

        
        if (hasMax) {

            values.push(max);

            conditions.push(
                `price <= $${values.length}`
            );

        }

        
        const whereClause = conditions.length > 0
            ? ` WHERE ${conditions.join(" AND ")}`
            : "";

        
        const countResult = await pool.query(
            `SELECT COUNT(*) AS total
             FROM hotels ${whereClause}`,
            values
        );

        const total = Number(countResult.rows[0].total);

        const totalPages = Math.ceil(total / pageSize);

        
        const dataValues = [
            ...values,
            pageSize,
            offset
        ];

        
        const result = await pool.query(
            `SELECT * FROM hotels
             ${whereClause}
             ORDER BY id ASC
             LIMIT $${values.length + 1}
             OFFSET $${values.length + 2}`,
            dataValues
        );

        return res.status(200).json({

            hotels: result.rows,

            pagination: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPreviousPage: pageNumber > 1 && total > 0
            }

        });

    } catch (error) {

        console.error("GET hotels error:", error);

        return res.status(500).json({
            message: "Unable to fetch hotels"
        });

    }

});

app.get("/api/hotels/:id", async (req, res) => {

    
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid hotel ID"
        });
    }

    try {

        const result = await pool.query(
            "SELECT * FROM hotels WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Hotel not found"
            });
        }

        
        return res.status(200).json(result.rows[0]);

    } catch (error) {

        console.error("GET hotel by ID error:", error);

        return res.status(500).json({
            message: "Unable to fetch hotel"
        });

    }

});

app.post(
    "/api/hotels",
    upload.single("image"),
    async (req, res) => {  
        const imagePath = req.file
            ? `/uploads/${req.file.filename}`
            : null;    
        const validation = validateHotelFields(req.body);   
        if (!req.file) {
            return res.status(400).json({
                message: "Hotel image is required"
            });
        }
        if (validation.error) {
            await deleteImageFile(imagePath);
            return res.status(400).json({
                message: validation.error
            });
        }
        const {
            title,
            description,
            latitude,
            longitude,
            price
        } = validation.data;
        try {
            const result = await pool.query(

                `INSERT INTO hotels
                (image, title, description,
                 latitude, longitude, price)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,

                [
                    imagePath,
                    title,
                    description,
                    latitude,
                    longitude,
                    price
                ]

            );

            return res.status(201).json({
                message: "Hotel created successfully",
                hotel: result.rows[0]
            });

        } catch (error) {

            console.error("POST hotel error:", error);

            
            await deleteImageFile(imagePath);

            return res.status(500).json({
                message: "Unable to create hotel"
            });

        }

    }
);

app.put(
    "/api/hotels/:id",
    upload.single("image"),
    async (req, res) => {

        
        const id = Number(req.params.id);

        
        const newImagePath = req.file
            ? `/uploads/${req.file.filename}`
            : null;

        
        if (!Number.isSafeInteger(id) || id <= 0) {

            if (newImagePath) {
                await deleteImageFile(newImagePath);
            }

            return res.status(400).json({
                message: "Invalid hotel ID"
            });

        }

        
        const validation = validateHotelFields(req.body);

        if (validation.error) {

            if (newImagePath) {
                await deleteImageFile(newImagePath);
            }

            return res.status(400).json({
                message: validation.error
            });

        }

        const {
            title,
            description,
            latitude,
            longitude,
            price
        } = validation.data;

        try {

            
            const existingResult = await pool.query(
                "SELECT image FROM hotels WHERE id = $1",
                [id]
            );

            if (existingResult.rows.length === 0) {

                if (newImagePath) {
                    await deleteImageFile(newImagePath);
                }

                return res.status(404).json({
                    message: "Hotel not found"
                });

            }

            
            const oldImagePath = existingResult.rows[0].image;

            
            const finalImagePath =
                newImagePath ?? oldImagePath;

            
            const updateResult = await pool.query(

                `UPDATE hotels
                 SET
                    image = $1,
                    title = $2,
                    description = $3,
                    latitude = $4,
                    longitude = $5,
                    price = $6
                 WHERE id = $7
                 RETURNING *`,

                [
                    finalImagePath,
                    title,
                    description,
                    latitude,
                    longitude,
                    price,
                    id
                ]

            );

            if (updateResult.rows.length === 0) {

                if (newImagePath) {
                    await deleteImageFile(newImagePath);
                }

                return res.status(404).json({
                    message: "Hotel not found"
                });

            }

            
            if (
                newImagePath &&
                oldImagePath &&
                oldImagePath !== newImagePath
            ) {

                await deleteImageFile(oldImagePath);

            }

            return res.status(200).json({
                message: "Hotel updated successfully",
                hotel: updateResult.rows[0]
            });

        } catch (error) {

            console.error("PUT hotel error:", error);

            
            if (newImagePath) {
                await deleteImageFile(newImagePath);
            }

            return res.status(500).json({
                message: "Unable to update hotel"
            });

        }

    }
);

app.delete("/api/hotels/:id", async (req, res) => {

    const id = Number(req.params.id);

    
    if (!Number.isSafeInteger(id) || id <= 0) {

        return res.status(400).json({
            message: "Invalid hotel ID"
        });

    }

    try {

        
        const result = await pool.query(

            `DELETE FROM hotels
             WHERE id = $1
             RETURNING *`,

            [id]

        );

        
        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Hotel not found"
            });

        }

        const deletedHotel = result.rows[0];

        
        await deleteImageFile(deletedHotel.image);

        return res.status(200).json({
            message: "Hotel deleted successfully",
            hotel: deletedHotel
        });

    } catch (error) {

        console.error("DELETE hotel error:", error);

        return res.status(500).json({
            message: "Unable to delete hotel"
        });

    }

});


app.get("/api/db-test", async (req, res) => {

    try {

        const result = await pool.query(
            "SELECT NOW() AS current_time"
        );

        return res.status(200).json({
            message: "PostgreSQL connected successfully",
            databaseTime: result.rows[0].current_time
        });

    } catch (error) {

        console.error("Database test error:", error);

        return res.status(500).json({
            message: "Database connection failed"
        });

    }

});

app.use((req, res) => {

    return res.status(404).json({
        message: "Route not found"
    });

});

app.use((error, req, res, next) => {

    if (res.headersSent) {
        return next(error);
    }

    console.error("Request error:", error);

    if (error instanceof multer.MulterError) {

        const message =
            error.code === "LIMIT_FILE_SIZE"
                ? "Image must be 5 MB or smaller"
                : error.message;

        return res.status(400).json({
            message
        });

    }

    
    if (
        error.message &&
        error.message.startsWith("Only ")
    ) {
        return res.status(400).json({
            message: error.message
        });
    }

    return res.status(500).json({
        message: "Internal server error"
    });

});

app.listen(PORT, () => {

    console.log(
        `Hotel API server running on port ${PORT}`
    );

});
