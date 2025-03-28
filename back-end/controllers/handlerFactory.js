const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");

exports.factoryDeleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(
        new AppError(`No document found with ID ${req.params.id}`, 404)
      );
    }
    res.status(204).json({
      message: "success",
      data: null,
    });
  });
exports.factoryUpdateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(
        new AppError(`No document found with ID ${req.params.id}`, 404)
      );
    }
    res.status(200).json(doc);
  });
exports.factoryCreateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json(doc);
  });

exports.factoryGetOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // 🔹 Kiểm tra xem ID có hợp lệ không trước khi truy vấn
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError(`Invalid ID format: ${id}`, 400));
    }

    let query = Model.findById(id);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    // 🔹 Nếu không tìm thấy, trả về lỗi 404
    if (!doc) {
      return next(new AppError(`No document found with ID ${id}`, 404));
    }

    res.status(200).json({
      status: "success",
      data: doc,
    });
  });

exports.factoryGetAll = (Model, filter) =>
  catchAsync(async (req, res, next) => {
    if (!filter) filter = {};
    // For nested route
    if (req.params.communityId) filter.communityId = req.params.communityId;
    if (req.params.postId) filter.postId = req.params.postId;

    const features = new APIFeatures(
      Model.find(filter)
        .populate("userId") // Populate userId như bình thường
        .populate(Model.schema.paths.communityId ? "communityId" : ""), // ✅ Kiểm tra nếu có mới populate
      req.query
    )
      .filter()
      .sort()
      .limitFields();

    const doc = await features.query;
    res.status(200).json(doc);
  });
exports.factoryGetAllPaginate = (Model) =>
  catchAsync(async (req, res, next) => {
    // For nested route
    let filter = {};
    // if (req.params.tourId) filter = { tour: req.params.tourId };
    const { length } = await new APIFeatures(
      Model.find(filter),
      req.query
    ).filter().query;
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
    res.status(200).json({
      results: doc.length,
      total: length,
      totalPages: Math.ceil(length / req.query.limit),
      data: doc,
    });
  });
