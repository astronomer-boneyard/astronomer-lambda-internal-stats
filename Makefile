delete:
	aws lambda delete-function \
		--region us-east-1 \
		--function-name astronomer-lambda-internal-stats

get:
	aws lambda get-function \
		--region us-east-1 \
		--function-name astronomer-lambda-internal-stats

invoke:
	aws lambda invoke-async \
		--region us-east-1 \
		--function-name astronomer-lambda-internal-stats \
		--invoke-args $(payload)

list:
	aws lambda list-functions \
		--region us-east-1

list-event-sources:
	aws lambda list-event-sources \
		--region us-east-1

update:
	@npm install
	@zip -r ./MyLambda.zip * -x *.zip test
	aws lambda update-function-code \
		--region us-east-1 \
		--function-name astronomer-lambda-internal-stats \
		--zip-file fileb://MyLambda.zip

upload:
	@npm install
	@zip -r ./MyLambda.zip * -x *.json *.zip test.js
	aws lambda create-function \
		--region us-east-1 \
		--function-name astronomer-lambda-internal-stats \
		--zip-file fileb://MyLambda.zip \
		--handler dist/MyLambda.handler \
		--runtime nodejs \
		--role arn:aws:iam::213824691356:role/lambda_s3_exec_role \

test:
	@npm test

.PROXY: delete get invoke list list-event-sources update upload test
