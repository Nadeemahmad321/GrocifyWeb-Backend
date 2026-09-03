import {AppError} from '../utils/response.js';
export const validate=schema=>(req,res,next)=>{const result=schema.safeParse({body:req.body,params:req.params,query:req.query});if(!result.success)return next(new AppError('Validation failed',422,result.error.issues));req.body=result.data.body;next()};
