class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // BUILD QUERY
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const queryObj = { ...this.queryString }; //we are putting like this to avoid direct reference to object
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // we have to remove these fields from the query
    excludedFields.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    // regular exp to replace
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //g-replace all with gt,gte if it not then only first ocuurance will be replaced, \b-we only want to match these exct words not like agtekj if not \b then this wil be matched
    console.log('query', JSON.parse(queryStr));

    this.query = this.query.find(JSON.parse(queryStr));
    // let query = Tour.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      //if there is sort word in our url this will be executed
      // query = query.sort(req.query.sort); //mongoose will automatically sort it with what value we give to sort. Suppose sort:price then it will sort the price from lowest to highest
      // supoose if two prices are same then how it will sort?
      // we can specify second field so if prices are same then it will sort based on second field
      // in mongoose format sort('price ratingsAverage')
      // IN url just give ?sort=price,ratingsAverage
      // now take the sort value remove , and add " "
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
      console.log(sortBy);
    } else {
      //default one
      // newly created query first
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limit() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); //- means exclude it and fetch all
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; //if req.querypage exists then that will be taken or 1 is default
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit; //formula to calculate the skip

    this.query = this.query.skip(skip).limit(limit);
    return this;
    // if user asks for page that does not exist then no tour will be returned
  }
}

module.exports = APIFeatures;
