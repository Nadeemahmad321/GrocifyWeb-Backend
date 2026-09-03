export const ok=(res,data,message='Operation completed',meta={})=>res.json({success:true,message,data,meta});
export const created=(res,data,message='Created successfully')=>res.status(201).json({success:true,message,data,meta:{}});
export class AppError extends Error{constructor(message,status=400,errors=[]){super(message);this.status=status;this.errors=errors}}
export const asyncHandler=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
